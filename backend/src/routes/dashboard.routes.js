const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/metrics', dashboardController.getMetrics);
router.get('/trends', dashboardController.getMonthlyTrends);
router.get('/expenses', dashboardController.getExpenseDistribution);
router.get('/budgets', dashboardController.getBudgetUtilisation);

module.exports = router;
