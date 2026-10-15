const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public Webhook endpoints
router.get('/webhook', whatsappController.verifyWebhook);
router.post('/webhook', whatsappController.handleWebhookEvent);

// Protected — send bill via Twilio WhatsApp Sandbox
router.post('/send-bill',    verifyToken, whatsappController.sendBill);
router.post('/send-invoice', verifyToken, whatsappController.sendInvoice); // alias

module.exports = router;
