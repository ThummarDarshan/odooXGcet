const dashboardService = require('../services/dashboard.service');
const budgetService = require('../services/budgets.service');

class DashboardController {
    async getMetrics(req, res, next) {
        try {
            const metrics = await dashboardService.getMetrics();
            res.json({
                success: true,
                data: metrics
            });
        } catch (error) {
            next(error);
        }
    }

    async getMonthlyTrends(req, res, next) {
        try {
            const trends = await dashboardService.getMonthlyTrends();
            res.json({
                success: true,
                data: trends
            });
        } catch (error) {
            next(error);
        }
    }

    async getExpenseDistribution(req, res, next) {
        try {
            const distribution = await dashboardService.getExpenseDistribution();
            res.json({
                success: true,
                data: distribution
            });
        } catch (error) {
            next(error);
        }
    }

    async getBudgetUtilisation(req, res, next) {
        try {
            // Re-use logic from budget service to get all budgets with calculated actuals
            const budgetsData = await budgetService.getBudgets({ limit: 100 });
            const budgets = budgetsData.data;

            // Transform for dashboard
            const budgetVsActualData = budgets.map(b => ({
                name: b.analytical_account?.name || 'Unknown',
                planned: Number(b.budgeted_amount),
                actual: Number(b.actual_amount)
            }));

            const budgetUtilization = budgets.map(b => ({
                name: b.analytical_account?.name || 'Unknown',
                utilized: Number(b.achievement_percentage),
                planned: Number(b.budgeted_amount),
                actual: Number(b.actual_amount),
                status: b.computed_status === 'over_budget' ? 'over' : b.computed_status === 'near_limit' ? 'warning' : 'under'
            }));

            res.json({
                success: true,
                data: {
                    budgetVsActualData,
                    budgetUtilization
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DashboardController();
