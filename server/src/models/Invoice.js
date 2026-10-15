const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productSnapshot: {
      name: { type: String, required: true },
      hsnCode: { type: String, default: '' },
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.001, 'Quantity must be greater than zero'],
    },
    unit: {
      type: String,
      default: 'pcs',
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative'],
    },
    taxRate: {
      type: Number,
      default: 0, // GST percentage
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    customerSnapshot: {
      name: { type: String, default: 'Cash Customer' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    items: {
      type: [invoiceItemSchema],
      validate: [
        (items) => items && items.length > 0,
        'Invoice must contain at least one item',
      ],
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['draft', 'pending', 'paid', 'partial'],
      default: 'draft',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'credit', 'card', 'split', 'pending'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    sentViaWhatsApp: {
      type: Boolean,
      default: false,
    },
    whatsappStatus: {
      type: String,
      enum: ['not_sent', 'queued', 'sent', 'delivered', 'read', 'failed'],
      default: 'not_sent',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index on shopId and invoiceNumber
invoiceSchema.index({ shopId: 1, invoiceNumber: 1 });
invoiceSchema.index({ shopId: 1, createdAt: -1 });

/**
 * Pre-save hook: automatically recalculate subtotal, taxTotal, line totals, and grand total
 */
invoiceSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    let calculatedSubtotal = 0;
    let calculatedTaxTotal = 0;

    this.items.forEach((item) => {
      const baseAmount = +(item.quantity * item.unitPrice).toFixed(2);
      const taxAmount = +((baseAmount * (item.taxRate || 0)) / 100).toFixed(2);
      const lineTotal = +(baseAmount + taxAmount).toFixed(2);

      item.taxAmount = taxAmount;
      item.lineTotal = lineTotal;

      calculatedSubtotal += baseAmount;
      calculatedTaxTotal += taxAmount;
    });

    this.subtotal = +calculatedSubtotal.toFixed(2);
    this.taxTotal = +calculatedTaxTotal.toFixed(2);

    const discount = +(this.discountAmount || 0).toFixed(2);
    const grandTotal = Math.max(0, +(this.subtotal + this.taxTotal - discount).toFixed(2));
    this.total = grandTotal;
  }
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
