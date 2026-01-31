const budgetService = require('../services/budgets.service');

class BudgetController {
    create = async (req, res, next) => {
        try {
            const budget = await budgetService.createBudget(req.body, req.user.id);
            res.status(201).json(budget);
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req, res, next) => {
        try {
            const result = await budgetService.getBudgets(req.query);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    getOne = async (req, res, next) => {
        try {
            const budget = await budgetService.getBudgetById(req.params.id);
            res.json(budget);
        } catch (error) {
            next(error);
        }
    };

    update = async (req, res, next) => {
        try {
            const budget = await budgetService.updateBudget(req.params.id, req.body);
            res.json(budget);
        } catch (error) {
            next(error);
        }
    };

    delete = async (req, res, next) => {
        try {
            await budgetService.deleteBudget(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };
}

module.exports = new BudgetController();
