const vendorBillService = require('../services/vendorBills.service');

class VendorBillController {
    create = async (req, res, next) => {
        try {
            const bill = await vendorBillService.createVendorBill(req.body, req.user.id);
            res.status(201).json(bill);
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req, res, next) => {
        try {
            const result = await vendorBillService.getVendorBills(req.query);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    getOne = async (req, res, next) => {
        try {
            const bill = await vendorBillService.getVendorBillById(req.params.id);
            res.json(bill);
        } catch (error) {
            next(error);
        }
    };

    update = async (req, res, next) => {
        try {
            const bill = await vendorBillService.updateVendorBill(req.params.id, req.body, req.user.id);
            res.json(bill);
        } catch (error) {
            next(error);
        }
    };

    delete = async (req, res, next) => {
        try {
            await vendorBillService.deleteVendorBill(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };
}

module.exports = new VendorBillController();
