const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyUser, requireRole } = require('../middleware/auth');

router.get('/predictive', verifyUser, requireRole('admin'), reportController.getPredictiveReports);

module.exports = router;
