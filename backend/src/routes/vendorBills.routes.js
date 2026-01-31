const express = require('express');
const vendorBillController = require('../controllers/vendorBills.controller');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', vendorBillController.getAll);
router.get('/:id', vendorBillController.getOne);
router.post('/', vendorBillController.create);
router.patch('/:id', vendorBillController.update);
router.delete('/:id', vendorBillController.delete);

module.exports = router;
