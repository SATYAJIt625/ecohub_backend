/**
 * Transactions Controller
 * Full CRUD for financial transactions
 */

const Transaction = require('../models/Transaction');

// ─── @route  GET /api/transactions ───────────────────────────────────────────
// ─── @access Private
const getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    // Calculate totals for the filtered set
    const totals = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const income = totals.find((t) => t._id === 'income')?.total || 0;
    const expenses = totals.find((t) => t._id === 'expense')?.total || 0;

    res.json({
      success: true,
      count: transactions.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      summary: { income, expenses, balance: income - expenses },
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  POST /api/transactions ──────────────────────────────────────────
// ─── @access Private (Admin, Treasurer)
const createTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.create({
      ...req.body,
      createdBy: req.user.id,
    });

    const populated = await transaction.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully.',
      transaction: populated,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  PUT /api/transactions/:id ───────────────────────────────────────
// ─── @access Private (Admin, Treasurer)
const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    res.json({ success: true, message: 'Transaction updated.', transaction });
  } catch (error) {
    next(error);
  }
};

// ─── @route  DELETE /api/transactions/:id ────────────────────────────────────
// ─── @access Private (Admin only)
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    res.json({ success: true, message: 'Transaction deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction };
