/**
 * Input Validation Middleware
 * Uses express-validator for request validation
 */

const { body, param, query, validationResult } = require('express-validator');

// ─── Validation Result Handler ────────────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Auth Validators ──────────────────────────────────────────────────────────
const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'treasurer', 'member'])
    .withMessage('Invalid role'),
  validate,
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// ─── Transaction Validators ───────────────────────────────────────────────────
const transactionValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be income or expense'),
  body('category').notEmpty().withMessage('Category is required'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  validate,
];

// ─── Budget Validators ────────────────────────────────────────────────────────
const budgetValidator = [
  body('name').trim().notEmpty().withMessage('Budget name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('plannedAmount')
    .isFloat({ min: 0 })
    .withMessage('Planned amount must be non-negative'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),
  body('year').isInt({ min: 2020 }).withMessage('Year must be 2020 or later'),
  validate,
];

module.exports = {
  registerValidator,
  loginValidator,
  transactionValidator,
  budgetValidator,
};
