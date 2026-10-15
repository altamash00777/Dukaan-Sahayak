const Expense = require('../models/Expense');

/**
 * @desc    Record a new shop expense (chai, bijli, rent, etc.)
 * @route   POST /api/expenses
 * @access  Private
 */
const create = async (req, res, next) => {
  try {
    const { category, amount, description, date } = req.body;

    if (!category || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Expense category and amount are required',
      });
    }

    const expense = new Expense({
      shopId: req.shopId,
      category,
      amount: Number(amount),
      description: description || '',
      date: date ? new Date(date) : new Date(),
      createdBy: req.user._id,
    });

    await expense.save();

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all expenses with category and date range filter
 * @route   GET /api/expenses
 * @access  Private
 */
const getAll = async (req, res, next) => {
  try {
    const { category, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = { shopId: req.shopId };

    if (category) {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [expenses, totalCount, totalAmountAgg] = await Promise.all([
      Expense.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'name'),
      Expense.countDocuments(filter),
      Expense.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalExpenseSum = totalAmountAgg.length > 0 ? +totalAmountAgg[0].total.toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: expenses,
      totalExpenseSum,
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

module.exports = {
  create,
  getAll,
};
