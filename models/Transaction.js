/**
 * Transaction Model
 * Represents income and expense transactions
 */

const mongoose = require('mongoose');

const CATEGORIES = [
  'food',
  'events',
  'maintenance',
  'equipment',
  'travel',
  'utilities',
  'salaries',
  'marketing',
  'donations',
  'membership',
  'grants',
  'sponsorship',
  'other',
];

const transactionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Transaction title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be positive'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Transaction type is required'],
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [{ type: String, trim: true }],
    attachmentUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
transactionSchema.index({ date: -1 });
transactionSchema.index({ type: 1, category: 1 });
transactionSchema.index({ createdBy: 1 });

// Virtual: formatted amount
transactionSchema.virtual('formattedAmount').get(function () {
  return `${this.type === 'income' ? '+' : '-'}$${this.amount.toFixed(2)}`;
});

// Static: Get monthly summary
transactionSchema.statics.getMonthlySummary = async function (year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  return this.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.CATEGORIES = CATEGORIES;
