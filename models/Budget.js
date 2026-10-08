/**
 * Budget Model
 * Monthly budget planning and tracking
 */

const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Budget name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
    },
    plannedAmount: {
      type: Number,
      required: [true, 'Planned amount is required'],
      min: [0, 'Planned amount cannot be negative'],
    },
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 2020,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    alertThreshold: {
      type: Number,
      default: 80, // Alert at 80% of budget
      min: 1,
      max: 100,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to prevent duplicate budget entries
budgetSchema.index({ category: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
