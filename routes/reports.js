const express = require('express');
const router = express.Router();
const { getSummary, getCategoryReport } = require('../controllers/reportsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary', getSummary);
router.get('/category', getCategoryReport);

module.exports = router;
