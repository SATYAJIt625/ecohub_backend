const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUserRole, deleteUser } = require('../controllers/usersController');
const { protect, authorize } = require('../middleware/auth');

// All user routes require authentication
router.use(protect);

router.get('/', authorize('admin', 'treasurer'), getAllUsers);
router.get('/:id', authorize('admin'), getUserById);
router.put('/:id/role', authorize('admin'), updateUserRole);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
