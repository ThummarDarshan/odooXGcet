const crypto = require('crypto');
const razorpay = require('../config/razorpay');

class RazorpayService {
    /**
     * Create a Razorpay Order
     * @param {number} amount - Amount in smallest currency unit (e.g., paise for INR)
     * @param {string} receipt - Receipt ID (e.g., internal invoice number)
     * @param {string} currency - Currency code (default INR)
     */
    async createOrder(amount, receipt, currency = 'INR') {
        try {
            const options = {
                amount, // amount in the smallest currency unit
                currency,
                receipt,
            };
            const order = await razorpay.orders.create(options);
            return order;
        } catch (error) {
            throw new Error(`Razorpay Order Creation Failed: ${error.message}`);
        }
    }

    /**
     * Verify Razorpay Payment Signature
     * @param {string} orderId - Razorpay Order ID
     * @param {string} paymentId - Razorpay Payment ID
     * @param {string} signature - Razorpay Signature
     * @returns {boolean} - True if valid
     */
    verifySignature(orderId, paymentId, signature) {
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(orderId + '|' + paymentId)
            .digest('hex');

        return generatedSignature === signature;
    }

    /**
     * Fetch a payment details from Razorpay
     * Useful to check status (captured/authorized) if needed
     * @param {string} paymentId 
     */
    async fetchPayment(paymentId) {
        try {
            return await razorpay.payments.fetch(paymentId);
        } catch (error) {
            throw new Error(`Failed to fetch payment from Razorpay: ${error.message}`);
        }
    }
}

module.exports = new RazorpayService();
