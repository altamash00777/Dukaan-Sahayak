const mongoose = require('mongoose');

const aiActionLogSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    input: {
      type: String,
      required: true,
    },
    intent: {
      type: String,
      trim: true,
      default: '',
    },
    tool: {
      type: String,
      trim: true,
      default: '',
    },
    toolArgs: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: ['success', 'error', 'pending'],
      default: 'success',
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

aiActionLogSchema.index({ shopId: 1, timestamp: -1 });

const AIActionLog = mongoose.model('AIActionLog', aiActionLogSchema);

module.exports = AIActionLog;
