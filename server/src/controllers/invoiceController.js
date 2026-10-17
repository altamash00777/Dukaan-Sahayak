
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Shop = require('../models/Shop');
const billingService = require('../services/billingService');
const invoiceService = require('../services/invoiceService');

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

    return res.status(201).json({
      success: true,
      message: 'Invoice draft saved successfully',
      data: draft,
    });
  } catch (error) {
    next(error);
  }
};

const confirmInvoice = async (req, res, next) => {
  try {
    const confirmedInvoice = await billingService.confirmInvoice(
      req.params.id,
      req.shopId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Invoice confirmed successfully',
      data: confirmedInvoice,
    });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const {
      status,
      paymentMethod,
      customerId,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = { shopId: req.shopId };

    if (status) filter.paymentStatus = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (customerId) filter.customerId = customerId;

    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.max(
      1,
      Math.min(100, Number.parseInt(limit, 10) || 50)
    );

    const skip = (pageNum - 1) * limitNum;

    const [invoices, totalCount] = await Promise.all([
      Invoice.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('customerId', 'name phone'),
      Invoice.countDocuments(filter),
    ]);

    return res.status(200).json({
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

const getById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID',
      });
    }

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

    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

const getPDF = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID',
      });
    }

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

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    const pdfBuffer = await invoiceService.generateInvoicePDF(
      invoice,
      shop
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Invoice-${invoice.invoiceNumber || invoice._id}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

const deleteDraft = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID',
      });
    }

    const deletedInvoice = await Invoice.findOneAndDelete({
      _id: id,
      shopId: req.shopId,
      paymentStatus: 'draft',
    });

    if (deletedInvoice) {
      return res.status(200).json({
        success: true,
        message: 'Draft invoice deleted successfully',
        data: deletedInvoice,
      });
    }

    const existingInvoice = await Invoice.findOne({
      _id: id,
      shopId: req.shopId,
    }).select('_id paymentStatus');

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    return res.status(409).json({
      success: false,
      message: 'Only draft invoices can be deleted.',
    });
  } catch (error) {
    next(error);
  }
};

const deleteInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID',
      });
    }

    const deletedInvoice = await Invoice.findOneAndDelete({
      _id: id,
      shopId: req.shopId,
    });

    if (!deletedInvoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully',
      data: deletedInvoice,
    });
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
  deleteDraft,
  deleteInvoice,
};
