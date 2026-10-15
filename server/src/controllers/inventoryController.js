const Product = require('../models/Product');
const inventoryService = require('../services/inventoryService');

/**
 * @desc    Get inventory items with optional low stock filter
 * @route   GET /api/inventory
 * @access  Private
 */
const getInventory = async (req, res, next) => {
  try {
    const { lowStockOnly } = req.query;

    if (lowStockOnly === 'true') {
      const lowStockProducts = await inventoryService.getLowStockAlerts(req.shopId);
      return res.status(200).json({
        success: true,
        count: lowStockProducts.length,
        data: lowStockProducts,
      });
    }

    const products = await Product.find({ shopId: req.shopId }).sort({ currentStock: 1 });
    const summary = await inventoryService.getInventorySummary(req.shopId);

    res.status(200).json({
      success: true,
      summary,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get low stock alerts where currentStock <= reorderLevel
 * @route   GET /api/inventory/alerts
 * @access  Private
 */
const getAlerts = async (req, res, next) => {
  try {
    const alerts = await inventoryService.getLowStockAlerts(req.shopId);

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregate inventory statistics (valuation, product counts)
 * @route   GET /api/inventory/summary
 * @access  Private
 */
const getSummary = async (req, res, next) => {
  try {
    const summary = await inventoryService.getInventorySummary(req.shopId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  getAlerts,
  getSummary,
};
