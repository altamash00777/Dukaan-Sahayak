const mongoose = require('mongoose');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

/**
 * Retrieves products that have fallen to or below their reorder level
 * @param {string|mongoose.Types.ObjectId} shopId
 * @returns {Promise<Array<Product>>}
 */
const getLowStockAlerts = async (shopId) => {
  return await Product.find({
    shopId,
    $expr: { $lte: ['$currentStock', '$reorderLevel'] },
  }).sort({ currentStock: 1 });
};

/**
 * Records a stock movement and updates product currentStock atomically
 *
 * @param {string|mongoose.Types.ObjectId} shopId
 * @param {string|mongoose.Types.ObjectId} productId
 * @param {number} quantity - Positive for addition, negative for deduction
 * @param {'sale'|'purchase'|'return'|'adjustment'} movementType
 * @param {string|mongoose.Types.ObjectId|null} [referenceId=null]
 * @param {'Invoice'|'Purchase'|'Manual'|'Return'} [referenceType='Manual']
 * @param {mongoose.ClientSession|null} [session=null]
 * @returns {Promise<Product>} Updated product
 */
const updateStock = async (
  shopId,
  productId,
  quantity,
  movementType,
  referenceId = null,
  referenceType = 'Manual',
  session = null
) => {
  const parsedQty = Number(quantity);
  const options = { new: true };
  if (session) {
    options.session = session;
  }

  // 1. Update product stock
  const updatedProduct = await Product.findOneAndUpdate(
    { _id: productId, shopId },
    { $inc: { currentStock: parsedQty } },
    options
  );

  if (!updatedProduct) {
    throw new Error(`Product not found with ID ${productId}`);
  }

  // 2. Create StockMovement record
  const movementData = {
    shopId,
    productId,
    movementType,
    quantity: parsedQty,
    referenceId,
    referenceType,
    note: `Stock ${parsedQty >= 0 ? 'added' : 'deducted'} by ${Math.abs(parsedQty)} via ${referenceType}`,
    date: new Date(),
  };

  if (session) {
    await StockMovement.create([movementData], { session });
  } else {
    await StockMovement.create(movementData);
  }

  return updatedProduct;
};

/**
 * Returns overall inventory statistics for the shop
 * @param {string|mongoose.Types.ObjectId} shopId
 */
const getInventorySummary = async (shopId) => {
  const objectIdShopId = new mongoose.Types.ObjectId(shopId.toString());

  const summary = await Product.aggregate([
    { $match: { shopId: objectIdShopId } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalStockQuantity: { $sum: '$currentStock' },
        totalStockValuation: {
          $sum: { $multiply: ['$currentStock', '$purchaseCost'] },
        },
        potentialSalesValue: {
          $sum: { $multiply: ['$currentStock', '$sellingPrice'] },
        },
        lowStockCount: {
          $sum: {
            $cond: [{ $lte: ['$currentStock', '$reorderLevel'] }, 1, 0],
          },
        },
        outOfStockCount: {
          $sum: {
            $cond: [{ $lte: ['$currentStock', 0] }, 1, 0],
          },
        },
      },
    },
  ]);

  if (summary.length === 0) {
    return {
      totalProducts: 0,
      totalStockQuantity: 0,
      totalStockValuation: 0,
      potentialSalesValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    };
  }

  const result = summary[0];
  delete result._id;
  result.totalStockValuation = +result.totalStockValuation.toFixed(2);
  result.potentialSalesValue = +result.potentialSalesValue.toFixed(2);
  return result;
};

module.exports = {
  getLowStockAlerts,
  updateStock,
  getInventorySummary,
};
