const Customer = require('../models/Customer');
const ledgerService = require('../services/ledgerService');

/**
 * @desc    Get all customers with search and pagination
 * @route   GET /api/customers
 * @access  Private
 */
const getAll = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50, hasUdhar } = req.query;

    const filter = { shopId: req.shopId };

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: searchRegex }, { phone: searchRegex }];
    }

    if (hasUdhar === 'true') {
      filter.outstandingBalance = { $gt: 0 };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [customers, totalCount] = await Promise.all([
      Customer.find(filter)
        .sort({ outstandingBalance: -1, name: 1 })
        .skip(skip)
        .limit(limitNum),
      Customer.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: customers,
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
 * @desc    Get customer by ID
 * @route   GET /api/customers/:id
 * @access  Private
 */
const getById = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      shopId: req.shopId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new customer
 * @route   POST /api/customers
 * @access  Private
 */
const create = async (req, res, next) => {
  try {
    const customerData = {
      ...req.body,
      shopId: req.shopId,
    };

    const customer = new Customer(customerData);
    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Customer added successfully',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update customer details
 * @route   PUT /api/customers/:id
 * @access  Private
 */
const update = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, shopId: req.shopId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get customer Udhar / Khata ledger statement
 * @route   GET /api/customers/:id/ledger
 * @access  Private
 */
const getLedger = async (req, res, next) => {
  try {
    const ledger = await ledgerService.getCustomerLedger(req.shopId, req.params.id);

    res.status(200).json({
      success: true,
      data: ledger,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  getLedger,
};
