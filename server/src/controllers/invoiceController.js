const Invoice = require('../models/Invoice');
const Shop = require('../models/Shop');
const billingService = require('../services/billingService');
const invoiceService = require('../services/invoiceService');

/**
 * @desc    Create a new invoice draft (without stock deduction or customer ledger impact)
 * @route   POST /api/invoices/draft
 * @access  Private
 */
const createDraft = async (req, res, next) => {
  try {
    const { customerId, items, discountAmount, notes } = req.body;

    const draft = await billingService.createInvoiceDraft(
      req.shopId,
      customerId,
      items,
      discountAmount,
      notes
    );

    res.status(201).json({
      success: true,
      message: 'Invoice draft prepared successfully',
      data: draft,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Confirm an invoice draft (generates permanent number, deducts stock, updates ledger)
 * @route   POST /api/invoices/:id/confirm
 * @access  Private
 */
const confirmInvoice = async (req, res, next) => {
  try {
    const confirmedInvoice = await billingService.confirmInvoice(
      req.params.id,
      req.shopId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Invoice confirmed and finalized successfully',
      data: confirmedInvoice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all invoices for the shop with filter & pagination
 * @route   GET /api/invoices
 * @access  Private
 */
const getAll = async (req, res, next) => {
  try {
    const { status, paymentMethod, customerId, page = 1, limit = 50 } = req.query;

    const filter = { shopId: req.shopId };

    if (status) {
      filter.paymentStatus = status;
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    if (customerId) {
      filter.customerId = customerId;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [invoices, totalCount] = await Promise.all([
      Invoice.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('customerId', 'name phone'),
      Invoice.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single invoice by ID
 * @route   GET /api/invoices/:id
 * @access  Private
 */
const getById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      shopId: req.shopId,
    }).populate('customerId', 'name phone address email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate and stream PDF invoice
 * @route   GET /api/invoices/:id/pdf
 * @access  Private
 */
const getPDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      shopId: req.shopId,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    const shop = await Shop.findById(req.shopId);
    const pdfBuffer = await invoiceService.generateInvoicePDF(invoice, shop);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Invoice-${invoice.invoiceNumber}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDraft,
  confirmInvoice,
  getAll,
  getById,
  getPDF,
};
