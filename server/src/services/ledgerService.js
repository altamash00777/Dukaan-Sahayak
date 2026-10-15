const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

/**
 * Retrieves the complete Khata / Ledger for a specific customer
 * Generates an itemized statement combining invoices (debits) and payments (credits)
 *
 * @param {string|mongoose.Types.ObjectId} shopId
 * @param {string|mongoose.Types.ObjectId} customerId
 */
const getCustomerLedger = async (shopId, customerId) => {
  const customer = await Customer.findOne({ _id: customerId, shopId });
  if (!customer) {
    throw new Error('Customer not found');
  }

  // Fetch confirmed/pending invoices
  const invoices = await Invoice.find({
    shopId,
    customerId,
    paymentStatus: { $ne: 'draft' },
  }).sort({ createdAt: 1 });

  // Fetch payments
  const payments = await Payment.find({
    shopId,
    customerId,
  }).sort({ date: 1 });

  // Merge into chronological ledger timeline
  const ledgerEntries = [];

  invoices.forEach((inv) => {
    ledgerEntries.push({
      id: inv._id,
      type: 'INVOICE',
      date: inv.createdAt,
      reference: inv.invoiceNumber,
      debit: inv.total, // Increases customer debt
      credit: 0,
      paymentStatus: inv.paymentStatus,
      paymentMethod: inv.paymentMethod,
      notes: inv.notes || '',
    });
  });

  payments.forEach((pay) => {
    ledgerEntries.push({
      id: pay._id,
      type: 'PAYMENT',
      date: pay.date,
      reference: pay.reference || 'Cash/UPI Receipt',
      debit: 0,
      credit: pay.amount, // Decreases customer debt
      paymentMethod: pay.method,
      notes: pay.notes || '',
    });
  });

  // Sort chronologically ascending
  ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Compute running balance
  let runningBalance = 0;
  const entriesWithRunningBalance = ledgerEntries.map((entry) => {
    runningBalance += entry.debit - entry.credit;
    return {
      ...entry,
      balance: +runningBalance.toFixed(2),
    };
  });

  return {
    customer: {
      id: customer._id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      outstandingBalance: customer.outstandingBalance,
      whatsappOptIn: customer.whatsappOptIn,
    },
    totalDebited: +ledgerEntries.reduce((acc, curr) => acc + curr.debit, 0).toFixed(2),
    totalCredited: +ledgerEntries.reduce((acc, curr) => acc + curr.credit, 0).toFixed(2),
    calculatedBalance: +runningBalance.toFixed(2),
    entries: entriesWithRunningBalance.reverse(), // Return newest first for UI
  };
};

/**
 * Records a customer payment, reduces outstanding balance, and updates linked invoice status if applicable
 *
 * @param {string|mongoose.Types.ObjectId} shopId
 * @param {string|mongoose.Types.ObjectId} customerId
 * @param {string|mongoose.Types.ObjectId|null} [invoiceId=null]
 * @param {number} amount
 * @param {string} [method='cash']
 * @param {string} [reference='']
 * @param {string} [notes='']
 */
const recordPayment = async (
  shopId,
  customerId,
  invoiceId = null,
  amount = 0,
  method = 'cash',
  reference = '',
  notes = ''
) => {
  const numericAmount = Number(amount);
  if (numericAmount <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  const customer = await Customer.findOne({ _id: customerId, shopId });
  if (!customer) {
    throw new Error('Customer not found');
  }

  // 1. Create Payment record
  const payment = new Payment({
    shopId,
    customerId,
    invoiceId: invoiceId || null,
    amount: numericAmount,
    method,
    reference,
    notes,
    date: new Date(),
  });
  await payment.save();

  // 2. Decrement Customer outstanding balance
  customer.outstandingBalance = Math.max(0, +(customer.outstandingBalance - numericAmount).toFixed(2));
  await customer.save();

  // 3. If invoiceId provided, update invoice status
  if (invoiceId) {
    const invoice = await Invoice.findOne({ _id: invoiceId, shopId });
    if (invoice) {
      // Calculate total paid toward this invoice
      const allPayments = await Payment.aggregate([
        { $match: { invoiceId: new mongoose.Types.ObjectId(invoiceId.toString()) } },
        { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
      ]);

      const totalPaid = allPayments.length > 0 ? allPayments[0].totalPaid : numericAmount;

      if (totalPaid >= invoice.total) {
        invoice.paymentStatus = 'paid';
      } else if (totalPaid > 0) {
        invoice.paymentStatus = 'partial';
      }
      invoice.paymentMethod = method;
      await invoice.save();
    }
  }

  return {
    payment,
    updatedCustomerBalance: customer.outstandingBalance,
  };
};

module.exports = {
  getCustomerLedger,
  recordPayment,
};
