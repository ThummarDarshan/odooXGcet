const express = require('express');
const invoiceController = require('../controllers/customerInvoices.controller');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/', invoiceController.create);
router.get('/', invoiceController.list);
router.get('/:id', invoiceController.getOne);
router.patch('/:id', invoiceController.update);
router.delete('/:id', invoiceController.delete);

module.exports = router;
