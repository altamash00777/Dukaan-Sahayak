const Invoice = require('../models/Invoice');
const Shop = require('../models/Shop');
const WhatsAppMessage = require('../models/WhatsAppMessage');
const whatsappService = require('../services/whatsappService');

/**
 * @desc    Send bill text message to customer via Twilio WhatsApp Sandbox
 * @route   POST /api/whatsapp/send-bill
 * @access  Private
 */
const sendBill = async (req, res, next) => {
  try {
    const { invoiceId, phone, billData } = req.body;

    let recipientPhone = phone;
    let billText = '';
    let invoiceDoc = null;

    // ── Case 1: Send from a saved DB invoice ──────────────────────
    if (invoiceId) {
      invoiceDoc = await Invoice.findOne({ _id: invoiceId, shopId: req.shopId });
      if (!invoiceDoc) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }
      const shop = await Shop.findById(req.shopId);
      recipientPhone = phone || invoiceDoc.customerSnapshot?.phone;

      billText = whatsappService.buildBillText({
        shopName:      shop?.shopName,
        invoiceNumber: invoiceDoc.invoiceNumber,
        customerName:  invoiceDoc.customerSnapshot?.name,
        items:         invoiceDoc.items,
        subtotal:      invoiceDoc.subtotal,
        discount:      invoiceDoc.discountAmount,
        grandTotal:    invoiceDoc.total,
        paymentMode:   invoiceDoc.paymentMethod,
      });

    // ── Case 2: Send from frontend local bill data (no DB invoice) ─
    } else if (billData) {
      const shop = await Shop.findById(req.shopId);
      billText = whatsappService.buildBillText({
        shopName:      shop?.shopName || billData.shopName,
        invoiceNumber: billData.invoiceNumber || 'BILL-' + Date.now(),
        customerName:  billData.customerName,
        items:         billData.items,
        subtotal:      billData.subtotal,
        discount:      billData.discount,
        grandTotal:    billData.grandTotal || billData.totalAmount,
        paymentMode:   billData.paymentMode,
      });

    } else {
      return res.status(400).json({ success: false, message: 'invoiceId or billData is required' });
    }

    if (!recipientPhone) {
      return res.status(400).json({
        success: false,
        message: 'Customer phone number is required to send WhatsApp',
      });
    }

    // ── Send via Twilio ────────────────────────────────────────────
    const result = await whatsappService.sendBillViaTwilio(recipientPhone, billText);

    // Log to DB (best-effort)
    try {
      await WhatsAppMessage.create({
        shopId:            req.shopId,
        invoiceId:         invoiceDoc?._id || null,
        recipient:         recipientPhone,
        providerMessageId: result.sid || '',
        status:            result.success ? 'sent' : 'failed',
        sentAt:            new Date(),
      });

      if (invoiceDoc) {
        invoiceDoc.sentViaWhatsApp = true;
        invoiceDoc.whatsappStatus  = 'sent';
        await invoiceDoc.save();
      }
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: result.simulated
        ? 'WhatsApp bill sent (simulated — add Twilio keys to .env for real delivery)'
        : `Bill sent to WhatsApp +${whatsappService.formatPhoneNumber(recipientPhone)} ✅`,
      data: {
        sid:       result.sid,
        simulated: result.simulated || false,
        phone:     recipientPhone,
      },
    });
  } catch (error) {
    console.error('[WhatsApp sendBill error]:', error.message);
    // Return a helpful error — don't crash
    return res.status(500).json({
      success: false,
      message: `WhatsApp send failed: ${error.message}. Check Twilio credentials in .env`,
    });
  }
};

/**
 * @desc    WhatsApp Webhook Verification (GET) — for Meta/Twilio webhooks
 * @route   GET /api/whatsapp/webhook
 * @access  Public
 */
const verifyWebhook = (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const verified  = whatsappService.verifyWebhook(mode, token, challenge);
  if (verified) return res.status(200).send(verified);
  return res.sendStatus(403);
};

/**
 * @desc    Receive WhatsApp status updates (POST)
 * @route   POST /api/whatsapp/webhook
 * @access  Public
 */
const handleWebhookEvent = async (req, res) => {
  try {
    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    res.status(500).send('Webhook error');
  }
};

// Alias for old route
const sendInvoice = sendBill;

module.exports = {
  sendBill,
  sendInvoice,
  verifyWebhook,
  handleWebhookEvent,
};
