const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than zero'],
    },
    method: {
      type: String,
      enum: ['cash', 'upi', 'credit', 'card', 'bank_transfer'],
      default: 'cash',
    },
    reference: {
      type: String,
      trim: true,
      default: '', // UPI transaction ID, cheque number, etc.
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ shopId: 1, customerId: 1, date: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
