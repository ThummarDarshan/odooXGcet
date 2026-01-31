const express = require('express');
const salesOrderController = require('../controllers/salesOrders.controller');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/', salesOrderController.create);
router.get('/', salesOrderController.list);
router.get('/:id', salesOrderController.getOne);
router.patch('/:id', salesOrderController.update);
router.delete('/:id', salesOrderController.delete);

module.exports = router;
