const reportService = require('../services/reportService');
const Invoice = require('../models/Invoice');

/**
 * @desc    Get daily summary (sales, expenses, purchases, profit)
 * @route   GET /api/reports/daily
 * @access  Private
 */
const getDaily = async (req, res, next) => {
  try {
    const summary = await reportService.getDailySummary(req.shopId, req.query.date);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get monthly summary
 * @route   GET /api/reports/monthly
 * @access  Private
 */
const getMonthly = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const summary = await reportService.getMonthlySummary(req.shopId, year, month);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get product performance report (bestsellers, slow movers)
 * @route   GET /api/reports/products
 * @access  Private
 */
const getProducts = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await reportService.getProductReport(req.shopId, startDate, endDate);
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get daily sales chart data for Recharts
 * @route   GET /api/reports/sales-chart
 * @access  Private
 */
const getSalesChart = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const chartData = await reportService.getSalesChart(req.shopId, days);
    res.status(200).json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export sales data as a downloadable CSV
 * @route   GET /api/reports/export-csv
 * @access  Private
 */
const exportCSV = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {
      shopId: req.shopId,
      paymentStatus: { $ne: 'draft' },
    };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });

    const csvHeaders = [
      'Invoice Number',
      'Date',
      'Customer Name',
      'Customer Phone',
      'Items Count',
      'Subtotal (INR)',
      'Tax Total (INR)',
      'Discount (INR)',
      'Grand Total (INR)',
      'Payment Status',
      'Payment Method',
    ];

    const csvRows = invoices.map((inv) => {
      const dateFormatted = new Date(inv.createdAt).toISOString().split('T')[0];
      const safeCustomerName = `"${(inv.customerSnapshot?.name || 'Cash Customer').replace(/"/g, '""')}"`;
      const phone = inv.customerSnapshot?.phone || '';
      const itemsCount = inv.items ? inv.items.length : 0;

      return [
        inv.invoiceNumber,
        dateFormatted,
        safeCustomerName,
        phone,
        itemsCount,
        inv.subtotal,
        inv.taxTotal,
        inv.discountAmount,
        inv.total,
        inv.paymentStatus,
        inv.paymentMethod,
      ].join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="sales-report-${Date.now()}.csv"`
    );

    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDaily,
  getMonthly,
  getProducts,
  getSalesChart,
  exportCSV,
};
