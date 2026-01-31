const express = require('express');
const purchaseOrderController = require('../controllers/purchaseOrders.controller');
const authMiddleware = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');

const router = express.Router();

router.use(authMiddleware);

router.get('/', purchaseOrderController.getAll);
router.get('/:id', purchaseOrderController.getOne);
router.post('/', roleCheck(['ADMIN']), purchaseOrderController.create);
router.patch('/:id', purchaseOrderController.update);
router.delete('/:id', purchaseOrderController.delete);

module.exports = router;
