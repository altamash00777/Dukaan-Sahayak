/**
 * Dukaan Sahayak — WhatsApp Service
 *
 * Supports TWO modes:
 * 1. Twilio WhatsApp Sandbox (RECOMMENDED for hackathon — no business account needed)
 *    - Sign up free at twilio.com
 *    - Scan QR to join sandbox on your phone
 *    - Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in .env
 *
 * 2. wa.me link fallback (always works, no setup needed)
 *    - Opens WhatsApp with pre-filled bill message
 */

const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  let cleaned = phone.toString().replace(/[^0-9]/g, '');
  if (cleaned.length === 10) cleaned = `91${cleaned}`;
  return cleaned;
};

/**
 * Send bill via Twilio WhatsApp Sandbox
 * Returns { success, sid, simulated }
 */
const sendBillViaTwilio = async (phone, billText) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio Sandbox default

  // If credentials not configured, return mock success
  if (!accountSid || !authToken || accountSid.includes('your_') || accountSid === '') {
    console.warn('[WhatsApp] Twilio not configured — returning simulated success');
    return { success: true, simulated: true, sid: 'MOCK_' + Date.now() };
  }

  const twilio = require('twilio')(accountSid, authToken);
  const recipient = formatPhoneNumber(phone);

  const message = await twilio.messages.create({
    from: fromNumber,
    to:   `whatsapp:+${recipient}`,
    body: billText,
  });

  return { success: true, sid: message.sid, status: message.status };
};

/**
 * Build a formatted bill text message (Hinglish)
 */
const buildBillText = ({ shopName, invoiceNumber, customerName, items, subtotal, discount, grandTotal, paymentMode }) => {
  const shop   = shopName     || 'Dukaan Sahayak';
  const invNo  = invoiceNumber || 'DRAFT';
  const cust   = customerName  || 'Cash Customer';
  const mode   = (paymentMode || 'cash').toUpperCase();
  const date   = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  let itemLines = '';
  if (Array.isArray(items) && items.length > 0) {
    itemLines = items
      .map((it) => {
        const name  = it.name || it.productSnapshot?.name || 'Item';
        const qty   = it.quantity || 1;
        const price = Number(it.unitPrice || it.sellingPrice || it.price || 0);
        const total = Number(it.lineTotal || it.total || price * qty);
        return `  • ${name} × ${qty} = ₹${total.toFixed(2)}`;
      })
      .join('\n');
  }

  let text = `🛒 *${shop}*\n`;
  text += `━━━━━━━━━━━━━━━━━━\n`;
  text += `📋 Invoice: *${invNo}*\n`;
  text += `📅 Date: ${date}\n`;
  text += `👤 Customer: ${cust}\n`;
  text += `💳 Payment: *${mode}*\n`;
  text += `━━━━━━━━━━━━━━━━━━\n`;
  if (itemLines) {
    text += `*Items / सामान:*\n${itemLines}\n`;
    text += `━━━━━━━━━━━━━━━━━━\n`;
  }
  if (subtotal !== undefined) text += `Subtotal: ₹${Number(subtotal).toFixed(2)}\n`;
  if (discount && Number(discount) > 0) text += `Discount: -₹${Number(discount).toFixed(2)}\n`;
  text += `💰 *Total: ₹${Number(grandTotal).toFixed(2)}*\n`;
  text += `━━━━━━━━━━━━━━━━━━\n`;
  text += `धन्यवाद! फिर पधारें 🙏\n_Powered by Dukaan Sahayak_`;

  return text;
};

/**
 * Webhook verification for Meta (kept for compatibility)
 */
const verifyWebhook = (mode, token, challenge) => {
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return challenge;
  }
  return null;
};

module.exports = {
  formatPhoneNumber,
  sendBillViaTwilio,
  buildBillText,
  verifyWebhook,
  // kept for backward compat
  sendTextMessage:    sendBillViaTwilio,
  sendInvoiceMessage: async () => ({ success: true, simulated: true }),
};
