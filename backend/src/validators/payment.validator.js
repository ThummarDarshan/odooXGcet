const Joi = require('joi');

const createOrderSchema = Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().default('INR'),
    invoice_id: Joi.string().uuid().required(), // Linking to an internal invoice
});

const verifyPaymentSchema = Joi.object({
    razorpay_order_id: Joi.string().required(),
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature: Joi.string().required(),
    invoice_id: Joi.string().uuid().required(), // To know which invoice to update
    amount: Joi.number().positive().required(), // Amount verified
});

module.exports = {
    createOrderSchema,
    verifyPaymentSchema,
};
