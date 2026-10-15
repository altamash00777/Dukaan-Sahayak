const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');

/**
 * Helper to get UTC start and end bounds for a given date
 */
const getDayBounds = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  const startOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
  return { startOfDay, endOfDay };
};

/**
 * Returns comprehensive daily financial summary
 *
 * @param {string|mongoose.Types.ObjectId} shopId
 * @param {string|Date} [date]
 */
const getDailySummary = async (shopId, date) => {
  const shopObjectId = new mongoose.Types.ObjectId(shopId.toString());
  const { startOfDay, endOfDay } = getDayBounds(date);

  // 1. Sales aggregation
  const salesAgg = await Sale.aggregate([
    {
      $match: {
        shopId: shopObjectId,
        date: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$totalAmount' },
        saleCount: { $sum: 1 },
      },
    },
  ]);

  const totalSales = salesAgg.length > 0 ? +salesAgg[0].totalSales.toFixed(2) : 0;
  const saleCount = salesAgg.length > 0 ? salesAgg[0].saleCount : 0;

  // 2. Sales payment method breakdown via confirmed invoices
  const paymentMethodBreakdown = await Invoice.aggregate([
    {
      $match: {
        shopId: shopObjectId,
        paymentStatus: { $ne: 'draft' },
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: '$paymentMethod',
        total: { $sum: '$total' },
        count: { $sum: 1 },
      },
    },
  ]);

  // 3. Purchases aggregation
  const purchasesAgg = await Purchase.aggregate([
    {
      $match: {
        shopId: shopObjectId,
        date: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: null,
        totalPurchases: { $sum: '$totalAmount' },
        purchaseCount: { $sum: 1 },
      },
    },
  ]);

  const totalPurchases = purchasesAgg.length > 0 ? +purchasesAgg[0].totalPurchases.toFixed(2) : 0;
  const purchaseCount = purchasesAgg.length > 0 ? purchasesAgg[0].purchaseCount : 0;

  // 4. Expenses aggregation
  const expensesAgg = await Expense.aggregate([
    {
      $match: {
        shopId: shopObjectId,
        date: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' },
        expenseCount: { $sum: 1 },
      },
    },
  ]);

  const totalExpenses = expensesAgg.length > 0 ? +expensesAgg[0].totalExpenses.toFixed(2) : 0;
  const expenseCount = expensesAgg.length > 0 ? expensesAgg[0].expenseCount : 0;

  // 5. Estimated Profit:
  // Approximate gross margin assuming average profit margin or calculating from items
  const estimatedProfit = +(totalSales - totalPurchases - totalExpenses).toFixed(2);

  return {
    date: startOfDay.toISOString().split('T')[0],
    sales: {
      totalAmount: totalSales,
      count: saleCount,
      paymentBreakdown: paymentMethodBreakdown.map((b) => ({
        method: b._id,
        total: +b.total.toFixed(2),
        count: b.count,
      })),
    },
    purchases: {
      totalAmount: totalPurchases,
      count: purchaseCount,
    },
    expenses: {
      totalAmount: totalExpenses,
      count: expenseCount,
    },
    estimatedProfit,
  };
};

/**
 * Returns monthly performance report
 *
 * @param {string|mongoose.Types.ObjectId} shopId
 * @param {number} year
 * @param {number} month (1-12)
 */
const getMonthlySummary = async (shopId, year, month) => {
  const shopObjectId = new mongoose.Types.ObjectId(shopId.toString());
  const y = Number(year) || new Date().getUTCFullYear();
  const m = Number(month) ? Number(month) - 1 : new Date().getUTCMonth();

  const startOfMonth = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));

  // Monthly Sales
  const salesAgg = await Sale.aggregate([
    {
      $match: {
        shopId: shopObjectId,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      },
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$totalAmount' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Monthly Purchases
  const purchasesAgg = await Purchase.aggregate([
    {
      $match: {
        shopId: shopObjectId,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      },
    },
    {
      $group: {
        _id: null,
        totalPurchases: { $sum: '$totalAmount' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Monthly Expenses
  const expensesAgg = await Expense.aggregate([
    {
      $match: {
        shopId: shopObjectId,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      },
    },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const totalSales = salesAgg.length > 0 ? +salesAgg[0].totalSales.toFixed(2) : 0;
  const totalPurchases = purchasesAgg.length > 0 ? +purchasesAgg[0].totalPurchases.toFixed(2) : 0;
  const totalExpenses = expensesAgg.length > 0 ? +expensesAgg[0].totalExpenses.toFixed(2) : 0;

  return {
    year: y,
    month: m + 1,
    period: `${y}-${String(m + 1).padStart(2, '0')}`,
    totalSales,
    totalPurchases,
    totalExpenses,
    estimatedProfit: +(totalSales - totalPurchases - totalExpenses).toFixed(2),
    salesCount: salesAgg.length > 0 ? salesAgg[0].count : 0,
  };
};

/**
 * Returns bestsellers and slow-moving products
 *
 * @param {string|mongoose.Types.ObjectId} shopId
 * @param {string|Date} [startDate]
 * @param {string|Date} [endDate]
 */
const getProductReport = async (shopId, startDate, endDate) => {
  const shopObjectId = new mongoose.Types.ObjectId(shopId.toString());

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  // Aggregate items sold
  const soldItems = await Sale.aggregate([
    {
      $match: {
        shopId: shopObjectId,
        date: { $gte: start, $lte: end },
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        productName: { $first: '$items.name' },
        totalQuantitySold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.lineTotal' },
      },
    },
    { $sort: { totalQuantitySold: -1 } },
  ]);

  const soldProductIds = new Set(soldItems.map((item) => item._id.toString()));

  // Find all products in shop to detect slow movers / zero sales
  const allProducts = await Product.find({ shopId }).select('name currentStock sellingPrice');

  const slowMovers = allProducts
    .filter((p) => !soldProductIds.has(p._id.toString()))
    .map((p) => ({
      productId: p._id,
      productName: p.name,
      currentStock: p.currentStock,
      sellingPrice: p.sellingPrice,
      totalQuantitySold: 0,
      totalRevenue: 0,
    }))
    .slice(0, 10);

  return {
    period: {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    },
    bestsellers: soldItems.slice(0, 10).map((b) => ({
      productId: b._id,
      productName: b.productName,
      totalQuantitySold: b.totalQuantitySold,
      totalRevenue: +b.totalRevenue.toFixed(2),
    })),
    slowMovers,
  };
};

/**
 * Returns daily sales data for the last N days formatted for Recharts
 *
 * @param {string|mongoose.Types.ObjectId} shopId
 * @param {number} [days=7]
 * @returns {Promise<Array<{date: string, day: string, sales: number, orders: number}>>}
 */
const getSalesChart = async (shopId, days = 7) => {
  const shopObjectId = new mongoose.Types.ObjectId(shopId.toString());
  const numDays = Math.max(1, Math.min(Number(days) || 7, 90));

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (numDays - 1));
  startDate.setHours(0, 0, 0, 0);

  const sales = await Sale.aggregate([
    {
      $match: {
        shopId: shopObjectId,
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' },
        },
        totalSales: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
  ]);

  const salesMap = new Map(sales.map((s) => [s._id, s]));

  const chartData = [];
  const currentDate = new Date(startDate);
  const today = new Date();

  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
    const record = salesMap.get(dateStr);

    chartData.push({
      date: dateStr,
      day: dayName,
      sales: record ? +record.totalSales.toFixed(2) : 0,
      orders: record ? record.orders : 0,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return chartData;
};

module.exports = {
  getDailySummary,
  getMonthlySummary,
  getProductReport,
  getSalesChart,
};
