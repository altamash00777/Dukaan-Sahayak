const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const inventoryService = require('../services/inventoryService');

/**
 * @desc    Record a new stock purchase from supplier and increase inventory stock
 * @route   POST /api/purchases
 * @access  Private
 */
const create = async (req, res, next) => {
  try {
    const { supplier, items, totalAmount, notes, date } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one purchase item is required',
      });
    }

    // Populate or verify product names and compute line totals
    let calculatedTotal = 0;
    const processedItems = [];

    for (const item of items) {
      let productName = item.productName;
      if (!productName && item.productId) {
        const product = await Product.findOne({ _id: item.productId, shopId: req.shopId });
        if (product) {
          productName = product.name;
        }
      }

      const qty = Number(item.quantity);
      const cost = Number(item.unitCost);
      const lineTotal = +(qty * cost).toFixed(2);
      calculatedTotal += lineTotal;

      processedItems.push({
        productId: item.productId,
        productName: productName || 'Unknown Item',
        quantity: qty,
        unitCost: cost,
        lineTotal,
      });
    }

    const finalTotal = totalAmount !== undefined ? Number(totalAmount) : +calculatedTotal.toFixed(2);

    const purchase = new Purchase({
      shopId: req.shopId,
      supplier: {
        name: supplier?.name || 'Local Supplier',
        phone: supplier?.phone || '',
        gstin: supplier?.gstin || '',
      },
      items: processedItems,
      totalAmount: finalTotal,
      notes: notes || '',
      date: date ? new Date(date) : new Date(),
    });

    await purchase.save();

    // Increment inventory stock & update purchase cost
    for (const item of processedItems) {
      await inventoryService.updateStock(
        req.shopId,
        item.productId,
        Math.abs(item.quantity),
        'purchase',
        purchase._id,
        'Purchase'
      );

      // Optionally update latest purchase cost in product catalog
      if (item.unitCost > 0) {
        await Product.findOneAndUpdate(
          { _id: item.productId, shopId: req.shopId },
          { $set: { purchaseCost: item.unitCost } }
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Purchase recorded and inventory updated successfully',
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all purchases with pagination & date range filter
 * @route   GET /api/purchases
 * @access  Private
 */
const getAll = async (req, res, next) => {
  try {
    const { supplier, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = { shopId: req.shopId };

    if (supplier) {
      filter['supplier.name'] = new RegExp(supplier.trim(), 'i');
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [purchases, totalCount] = await Promise.all([
      Purchase.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum),
      Purchase.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: purchases,
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
