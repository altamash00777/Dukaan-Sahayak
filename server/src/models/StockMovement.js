const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true,
    },
    movementType: {
      type: String,
      enum: ['sale', 'purchase', 'return', 'adjustment'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      // Positive = stock added (purchase/return/adjustment)
      // Negative = stock removed (sale/spoilage/adjustment)
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    referenceType: {
      type: String,
      enum: ['Invoice', 'Purchase', 'Manual', 'Return'],
      default: 'Manual',
    },
    note: {
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

stockMovementSchema.index({ shopId: 1, productId: 1, date: -1 });

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

module.exports = StockMovement;
