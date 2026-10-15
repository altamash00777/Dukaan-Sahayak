const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/daily', reportController.getDaily);
router.get('/monthly', reportController.getMonthly);
router.get('/products', reportController.getProducts);
router.get('/sales-chart', reportController.getSalesChart);
router.get('/export-csv', reportController.exportCSV);

module.exports = router;
