/**
 * Budgets Controller
 * Monthly budget management and tracking
 */

const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// ─── @route  GET /api/budgets ─────────────────────────────────────────────────
// ─── @access Private
const getBudgets = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const now = new Date();

    const filter = {
      month: parseInt(month) || now.getMonth() + 1,
      year: parseInt(year) || now.getFullYear(),
    };

    const budgets = await Budget.find(filter).populate('createdBy', 'name');

    // For each budget, fetch actual spending from transactions
    const budgetsWithActual = await Promise.all(
      budgets.map(async (budget) => {
        const start = new Date(budget.year, budget.month - 1, 1);
        const end = new Date(budget.year, budget.month, 0, 23, 59, 59);

        const result = await Transaction.aggregate([
          {
            $match: {
              category: budget.category,
              type: 'expense',
              date: { $gte: start, $lte: end },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const actualAmount = result[0]?.total || 0;
        const percentage = budget.plannedAmount > 0
          ? Math.round((actualAmount / budget.plannedAmount) * 100)
          : 0;
        const isExceeded = actualAmount > budget.plannedAmount;
        const isAlerted = percentage >= budget.alertThreshold;

        return {
          ...budget.toObject(),
          actualAmount,
          percentage,
          remaining: budget.plannedAmount - actualAmount,
          isExceeded,
          isAlerted,
        };
      })
    );

    res.json({
      success: true,
      count: budgetsWithActual.length,
      budgets: budgetsWithActual,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  POST /api/budgets ────────────────────────────────────────────────
// ─── @access Private (Admin, Treasurer)
const createBudget = async (req, res, next) => {
  try {
    const budget = await Budget.create({
      ...req.body,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Budget created successfully.',
      budget,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  PUT /api/budgets/:id ────────────────────────────────────────────
// ─── @access Private (Admin, Treasurer)
const updateBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found.' });
    }

    res.json({ success: true, message: 'Budget updated.', budget });
  } catch (error) {
    next(error);
  }
};

// ─── @route  DELETE /api/budgets/:id ─────────────────────────────────────────
// ─── @access Private (Admin only)
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found.' });
    }
    res.json({ success: true, message: 'Budget deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };
