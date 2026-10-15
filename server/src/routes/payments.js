const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', paymentController.recordPayment);
router.get('/customer/:customerId/ledger', paymentController.getCustomerLedger);

module.exports = router;
