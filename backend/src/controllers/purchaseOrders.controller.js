const purchaseOrderService = require('../services/purchaseOrders.service');

class PurchaseOrderController {
    create = async (req, res, next) => {
        try {
            const po = await purchaseOrderService.createPurchaseOrder(req.body, req.user.id);
            res.status(201).json(po);
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req, res, next) => {
        try {
            const result = await purchaseOrderService.getPurchaseOrders(req.query);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    getOne = async (req, res, next) => {
        try {
            const po = await purchaseOrderService.getPurchaseOrderById(req.params.id);
            res.json(po);
        } catch (error) {
            next(error);
        }
    };

    update = async (req, res, next) => {
        try {
            const po = await purchaseOrderService.updatePurchaseOrder(req.params.id, req.body, req.user.id);
            res.json(po);
        } catch (error) {
            next(error);
        }
    };

    delete = async (req, res, next) => {
        try {
            await purchaseOrderService.deletePurchaseOrder(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };
}

module.exports = new PurchaseOrderController();
