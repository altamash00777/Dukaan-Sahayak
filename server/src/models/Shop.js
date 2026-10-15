const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      unique: true,
      index: true,
    },
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    language: {
      type: String,
      enum: ['hinglish', 'hindi', 'english'],
      default: 'hinglish',
    },
    invoicePrefix: {
      type: String,
      default: 'INV-',
      trim: true,
    },
    invoiceCounter: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Atomically increments invoiceCounter and returns formatted invoice number
 * e.g., INV-0001
 * @param {mongoose.ClientSession} [session] Optional transaction session
 * @returns {Promise<string>} Next formatted invoice number
 */
shopSchema.methods.getNextInvoiceNumber = async function (session = null) {
  const options = { new: true };
  if (session) {
    options.session = session;
  }

  const updatedShop = await this.constructor.findByIdAndUpdate(
    this._id,
    { $inc: { invoiceCounter: 1 } },
    options
  );

  if (!updatedShop) {
    throw new Error('Shop not found while generating invoice number');
  }

  this.invoiceCounter = updatedShop.invoiceCounter;
  const paddedSequence = String(updatedShop.invoiceCounter).padStart(4, '0');
  return `${updatedShop.invoicePrefix}${paddedSequence}`;
};

const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop;
