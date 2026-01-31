const paymentService = require('../services/payments.service');

class PaymentController {
    getAll = async (req, res, next) => {
        try {
            const result = await paymentService.getPayments(req.query, req.user);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    getOne = async (req, res, next) => {
        try {
            const payment = await paymentService.getPaymentById(req.params.id);
            res.json(payment);
        } catch (error) {
            next(error);
        }
    };

    create = async (req, res, next) => {
        try {
            // Check if it's a manual payment or generic payment creation
            const payment = await paymentService.createManualPayment(req.body, req.user.id);
            res.status(201).json(payment);
        } catch (error) {
            next(error);
        }
    };

    // Razorpay specific
    createPaymentOrder = async (req, res, next) => {
        try {
            const { invoice_id, amount } = req.body;
            const result = await paymentService.createPaymentOrder(
                req.user.id,
                invoice_id,
                amount
            );
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    };

    verifyPayment = async (req, res, next) => {
        try {
            const result = await paymentService.verifyAndRecordPayment(
                req.user.id,
                req.body
            );
            res.status(200).json({
                success: true,
                message: 'Payment verified and recorded successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    };
}

module.exports = new PaymentController();
