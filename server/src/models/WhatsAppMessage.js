const mongoose = require('mongoose');

const whatsAppMessageSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
      index: true,
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
    },
    providerMessageId: {
      type: String,
      trim: true,
      index: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'read', 'failed'],
      default: 'queued',
      index: true,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

whatsAppMessageSchema.index({ shopId: 1, recipient: 1, createdAt: -1 });

const WhatsAppMessage = mongoose.model('WhatsAppMessage', whatsAppMessageSchema);

module.exports = WhatsAppMessage;
