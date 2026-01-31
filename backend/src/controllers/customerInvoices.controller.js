const customerInvoiceService = require('../services/customerInvoices.service');

class CustomerInvoicesController {
    async create(req, res, next) {
        try {
            const invoice = await customerInvoiceService.create(req.body, req.user.id);
            res.status(201).json(invoice);
        } catch (error) {
            next(error);
        }
    }

    async list(req, res, next) {
        try {
            const result = await customerInvoiceService.getAll(req.query, req.user);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getOne(req, res, next) {
        try {
            const invoice = await customerInvoiceService.getOne(req.params.id);
            res.json(invoice);
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const invoice = await customerInvoiceService.update(req.params.id, req.body);
            res.json(invoice);
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            await customerInvoiceService.delete(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CustomerInvoicesController();
