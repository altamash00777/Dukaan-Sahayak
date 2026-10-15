const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: false,   // Optional — not all customers have WhatsApp/phone
      trim: true,
      default: '',
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    whatsappOptIn: {
      type: Boolean,
      default: true,
    },
    outstandingBalance: {
      type: Number,
      default: 0, // Positive value means customer owes shopkeeper money (Udhar)
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index on shopId and phone (customers identified uniquely per shop by phone)
customerSchema.index({ shopId: 1, phone: 1 });
customerSchema.index({ shopId: 1, name: 'text' });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
