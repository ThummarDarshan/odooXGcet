const analyticalService = require('../services/analytical.service');

class AnalyticalController {
    async createRule(req, res, next) {
        try {
            const rule = await analyticalService.createRule(req.body);
            res.status(201).json(rule);
        } catch (error) {
            next(error);
        }
    }

    async getRule(req, res, next) {
        try {
            const rule = await analyticalService.getRule(req.params.id);
            if (!rule) return res.status(404).json({ error: 'Rule not found' });
            res.json(rule);
        } catch (error) {
            next(error);
        }
    }

    async getRules(req, res, next) {
        try {
            const rules = await analyticalService.getRules();
            res.json(rules);
        } catch (error) {
            next(error);
        }
    }

    async updateRule(req, res, next) {
        try {
            const rule = await analyticalService.updateRule(req.params.id, req.body);
            res.json(rule);
        } catch (error) {
            next(error);
        }
    }

    async deleteRule(req, res, next) {
        try {
            await analyticalService.deleteRule(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AnalyticalController();
