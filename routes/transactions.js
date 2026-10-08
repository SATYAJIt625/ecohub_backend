const express = require('express');
const router = express.Router();
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionsController');
const { protect, authorize } = require('../middleware/auth');
const { transactionValidator } = require('../middleware/validators');

router.use(protect);

router.get('/', getTransactions);
router.post('/', authorize('admin', 'treasurer'), transactionValidator, createTransaction);
router.put('/:id', authorize('admin', 'treasurer'), transactionValidator, updateTransaction);
router.delete('/:id', authorize('admin'), deleteTransaction);

module.exports = router;
