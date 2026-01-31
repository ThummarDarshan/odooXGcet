const costCenterService = require('../services/costCenters.service');

class CostCenterController {
    create = async (req, res) => {
        try {
            const costCenter = await costCenterService.createCostCenter(req.body, req.user.id);
            res.status(201).json(costCenter);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };

    getAll = async (req, res) => {
        try {
            const result = await costCenterService.getCostCenters(req.query);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    getOne = async (req, res) => {
        try {
            const costCenter = await costCenterService.getCostCenterById(req.params.id);
            res.json(costCenter);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    };

    update = async (req, res) => {
        try {
            const costCenter = await costCenterService.updateCostCenter(req.params.id, req.body);
            res.json(costCenter);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };

    delete = async (req, res) => {
        try {
            await costCenterService.deleteCostCenter(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };
}

module.exports = new CostCenterController();
