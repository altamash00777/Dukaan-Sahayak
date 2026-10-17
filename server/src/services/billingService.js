const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Shop = require('../models/Shop');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const inventoryService = require('./inventoryService');

/**
 * Creates an invoice draft without deducting inventory or affecting customer ledger.
 * Looks up current product prices and calculates line totals with GST.
 *
 * @param {string|mongoose.Types.ObjectId} shopId
 * @param {string|mongoose.Types.ObjectId|null} customerId
 * @param {Array<{productId: string, quantity: number, unitPrice?: number, unit?: string, taxRate?: number}>} items
 * @param {number} [discountAmount=0]
 * @param {string} [notes='']
 * @returns {Promise<Invoice>} Created draft invoice
 */
const createInvoiceDraft = async (shopId, customerId, items, discountAmount = 0, notes = '') => {
  if (!items || items.length === 0) {
    throw new Error('At least one item is required to create an invoice draft');
  }

  // 1. Fetch customer details if provided
  let customerSnapshot = {
    name: 'Cash Customer',
    phone: '',
    address: '',
  };

  let validCustomerId = null;
if (customerId) {
  if (!mongoose.isValidObjectId(customerId)) {
    throw new Error('Invalid customer ID');
  }

  const customer = await Customer.findOne({
    _id: customerId,
    shopId,
  });

  if (!customer) {
    throw new Error('Customer not found in this shop');
  }

  validCustomerId = customer._id;

  customerSnapshot = {
    name: customer.name,
    phone: customer.phone || '',
    address: customer.address || '',
  };
}

  // 2. Fetch all products in items
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, shopId });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  // 3. Process items and compute prices & GST
  const computedItems = items.map((item) => {
    const product = productMap.get(item.productId.toString());
    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found in this shop`);
    }

    const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : product.sellingPrice;
    const taxRate = item.taxRate !== undefined ? Number(item.taxRate) : (product.taxRate || 0);
    const quantity = Number(item.quantity);
    const unit = item.unit || product.unit || 'pcs';

    const baseAmount = +(quantity * unitPrice).toFixed(2);
    const taxAmount = +((baseAmount * taxRate) / 100).toFixed(2);
    const lineTotal = +(baseAmount + taxAmount).toFixed(2);

    return {
      productId: product._id,
      productSnapshot: {
        name: product.name,
        hsnCode: product.hsnCode || '',
      },
      quantity,
      unit,
      unitPrice,
      taxRate,
      taxAmount,
      lineTotal,
    };
  });

  // 4. Calculate invoice totals
  const subtotal = computedItems.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);
  const taxTotal = computedItems.reduce((acc, i) => acc + i.taxAmount, 0);
  const total = Math.max(0, +(subtotal + taxTotal - Number(discountAmount || 0)).toFixed(2));

  // Generate temporary draft number
  const draftNumber = `DRAFT-${Date.now().toString().slice(-6)}`;

  const invoice = new Invoice({
    shopId,
    invoiceNumber: draftNumber,
    customerId: validCustomerId,
    customerSnapshot,
    items: computedItems,
    subtotal: +subtotal.toFixed(2),
    taxTotal: +taxTotal.toFixed(2),
    discountAmount: +Number(discountAmount || 0).toFixed(2),
    total,
    paymentStatus: 'draft',
    paymentMethod: 'pending',
    notes,
  });

  return await invoice.save();
};

/**
 * Confirms an invoice:
 * 1. Converts draft to permanent invoice with sequential number
 * 2. Deducts product stock via inventoryService StockMovements
 * 3. Records Sale record
 * 4. Records Payment and updates Customer outstanding balance if credit/partial
 *
 * @param {string|mongoose.Types.ObjectId} invoiceId
 * @param {string|mongoose.Types.ObjectId} shopId
 * @param {object} [paymentDetails]
 * @returns {Promise<Invoice>} Confirmed invoice
 */
const confirmInvoice = async (invoiceId, shopId, paymentDetails = {}) => {
  const invoice = await Invoice.findOne({ _id: invoiceId, shopId });
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.paymentStatus !== 'draft') {
    throw new Error(`Invoice is already confirmed with status: ${invoice.paymentStatus}`);
  }

  const shop = await Shop.findById(shopId);
  if (!shop) {
    throw new Error('Shop not found');
  }

  // Attempt using transaction session with fallback for standalone Mongo
  let session = null;
  let useTransaction = false;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransaction = true;
  } catch (sessErr) {
    // Standalone MongoDB without replica set does not support transactions
    session = null;
    useTransaction = false;
  }

  try {
    // 1. Generate sequential permanent invoice number
    const permanentInvoiceNumber = await shop.getNextInvoiceNumber(session);
    invoice.invoiceNumber = permanentInvoiceNumber;

    // 2. Set payment details
    const paymentStatus = paymentDetails.paymentStatus || 'paid';
    const paymentMethod = paymentDetails.paymentMethod || 'cash';
    invoice.paymentStatus = paymentStatus;
    invoice.paymentMethod = paymentMethod;
    if (paymentDetails.notes) {
      invoice.notes = paymentDetails.notes;
    }

    // 3. Deduct stock for each item
    for (const item of invoice.items) {
      await inventoryService.updateStock(
        shopId,
        item.productId,
        -Math.abs(item.quantity),
        'sale',
        invoice._id,
        'Invoice',
        session
      );
    }

    // 4. Create Sale record
    const saleData = {
      shopId,
      invoiceId: invoice._id,
      items: invoice.items.map((i) => ({
        productId: i.productId,
        name: i.productSnapshot.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
      })),
      totalAmount: invoice.total,
      date: new Date(),
    };

    if (session) {
      await Sale.create([saleData], { session });
    } else {
      await Sale.create(saleData);
    }

    // 5. Handle customer ledger & payment record
    const amountPaid =
      paymentDetails.amountPaid !== undefined
        ? Number(paymentDetails.amountPaid)
        : paymentStatus === 'paid'
        ? invoice.total
        : 0;

    const unpaidBalance = Math.max(0, +(invoice.total - amountPaid).toFixed(2));

    if (invoice.customerId) {
      if (unpaidBalance > 0) {
        // Customer has credit / unpaid amount
        const updateOpt = session ? { session } : {};
        await Customer.findByIdAndUpdate(
          invoice.customerId,
          { $inc: { outstandingBalance: unpaidBalance } },
          updateOpt
        );
      }

      if (amountPaid > 0) {
        const paymentRecord = {
          shopId,
          customerId: invoice.customerId,
          invoiceId: invoice._id,
          amount: amountPaid,
          method: paymentMethod === 'credit' ? 'cash' : paymentMethod,
          notes: `Payment for invoice ${permanentInvoiceNumber}`,
          date: new Date(),
        };

        if (session) {
          await Payment.create([paymentRecord], { session });
        } else {
          await Payment.create(paymentRecord);
        }
      }
    }

    // 6. Save confirmed invoice
    const saveOpt = session ? { session } : {};
    await invoice.save(saveOpt);

    if (useTransaction && session) {
      await session.commitTransaction();
    }

    return invoice;
  } catch (error) {
    if (useTransaction && session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

module.exports = {
  createInvoiceDraft,
  confirmInvoice,
};
