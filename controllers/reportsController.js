/**
 * Reports Controller
 * Analytics and reporting endpoints
 */

const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Budget = require('../models/Budget');

// ─── @route  GET /api/reports/summary ────────────────────────────────────────
// ─── @access Private
const getSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // All-time totals
    const allTimeTotals = await Transaction.aggregate([
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    // Current month totals
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    const monthTotals = await Transaction.aggregate([
      { $match: { date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    // Last 12 months trend
    const twelveMonthsAgo = new Date(currentYear, currentMonth - 13, 1);
    const monthlyTrend = await Transaction.aggregate([
      { $match: { date: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Recent 5 transactions
    const recentTransactions = await Transaction.find()
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .limit(5);

    const formatTotals = (arr) => ({
      income: arr.find((t) => t._id === 'income')?.total || 0,
      expenses: arr.find((t) => t._id === 'expense')?.total || 0,
    });

    const allTime = formatTotals(allTimeTotals);
    const thisMonth = formatTotals(monthTotals);

    // User count
    const memberCount = await User.countDocuments({ isActive: true });
    const transactionCount = await Transaction.countDocuments();

    res.json({
      success: true,
      data: {
        allTime: {
          ...allTime,
          balance: allTime.income - allTime.expenses,
        },
        thisMonth: {
          ...thisMonth,
          balance: thisMonth.income - thisMonth.expenses,
        },
        monthlyTrend,
        recentTransactions,
        stats: {
          memberCount,
          transactionCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/reports/category ───────────────────────────────────────
// ─── @access Private
const getCategoryReport = async (req, res, next) => {
  try {
    const { month, year, type } = req.query;
    const now = new Date();

    const targetMonth = parseInt(month) || now.getMonth() + 1;
    const targetYear = parseInt(year) || now.getFullYear();

    const start = new Date(targetYear, targetMonth - 1, 1);
    const end = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const matchFilter = { date: { $gte: start, $lte: end } };
    if (type) matchFilter.type = type;

    const categoryBreakdown = await Transaction.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { category: '$category', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Year-over-year comparison
    const prevYearStart = new Date(targetYear - 1, targetMonth - 1, 1);
    const prevYearEnd = new Date(targetYear - 1, targetMonth, 0, 23, 59, 59);

    const prevYearData = await Transaction.aggregate([
      { $match: { date: { $gte: prevYearStart, $lte: prevYearEnd } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      data: {
        period: { month: targetMonth, year: targetYear },
        categoryBreakdown,
        previousYear: prevYearData,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSummary, getCategoryReport };
