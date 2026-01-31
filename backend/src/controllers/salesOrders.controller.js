const salesOrderService = require('../services/salesOrders.service');

class SalesOrderController {
    async create(req, res, next) {
        try {
            const order = await salesOrderService.create(req.body, req.user.id);
            res.status(201).json(order);
        } catch (error) {
            next(error);
        }
    }

    async list(req, res, next) {
        try {
            const result = await salesOrderService.getAll(req.query);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getOne(req, res, next) {
        try {
            const order = await salesOrderService.getOne(req.params.id);
            res.json(order);
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const order = await salesOrderService.update(req.params.id, req.body);
            res.json(order);
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            await salesOrderService.delete(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SalesOrderController();
