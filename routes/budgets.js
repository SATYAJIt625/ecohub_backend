const express = require('express');
const router = express.Router();
const { getBudgets, createBudget, updateBudget, deleteBudget } = require('../controllers/budgetsController');
const { protect, authorize } = require('../middleware/auth');
const { budgetValidator } = require('../middleware/validators');

router.use(protect);

router.get('/', getBudgets);
router.post('/', authorize('admin', 'treasurer'), budgetValidator, createBudget);
router.put('/:id', authorize('admin', 'treasurer'), updateBudget);
router.delete('/:id', authorize('admin'), deleteBudget);

module.exports = router;
