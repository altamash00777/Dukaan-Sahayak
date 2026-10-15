const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    aliases: {
      type: [String],
      default: [],
      // e.g. ["Cheeni", "Shakkar", "Chini"] for Sugar
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    unit: {
      type: String,
      trim: true,
      default: 'pcs', // kg, g, l, ml, pcs, packet, bottle, box, etc.
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    purchaseCost: {
      type: Number,
      default: 0,
      min: [0, 'Purchase cost cannot be negative'],
    },
    currentStock: {
      type: Number,
      default: 0,
    },
    reorderLevel: {
      type: Number,
      default: 5,
      min: [0, 'Reorder level cannot be negative'],
    },
    hsnCode: {
      type: String,
      trim: true,
      default: '',
    },
    taxRate: {
      type: Number,
      default: 0, // GST percentage (e.g. 0, 5, 12, 18, 28)
      min: [0, 'Tax rate cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying products within a shop
productSchema.index({ shopId: 1, name: 1 });

// Full text search index on name and aliases
productSchema.index(
  { name: 'text', aliases: 'text', category: 'text' },
  { weights: { name: 10, aliases: 5, category: 1 } }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
