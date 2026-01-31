const express = require('express');
const paymentController = require('../controllers/payments.controller');
const validate = require('../middlewares/validate');
const { createOrderSchema, verifyPaymentSchema } = require('../validators/payment.validator');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// All payment routes require authentication
router.use(authMiddleware);

// Standard CRUD
router.get('/', paymentController.getAll);
router.get('/:id', paymentController.getOne);
router.post('/', paymentController.create); // Manual payment creation

// Razorpay / Online Payment Flows (Specific)
router.post(
    '/create-order',
    validate(createOrderSchema),
    paymentController.createPaymentOrder
);

router.post(
    '/verify',
    validate(verifyPaymentSchema),
    paymentController.verifyPayment
);

module.exports = router;
