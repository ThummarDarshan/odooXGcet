const prisma = require('../config/database');
const budgetService = require('./budgets.service');
const razorpayService = require('./razorpay.service');

class PaymentService {
    async getPayments(filters = {}, user = null) {
        const { search, type, mode, page = 1, limit = 20 } = filters;
        const where = {};

        // Security: Restrict CUSTOMER to their own data
        if (user && user.role === 'CUSTOMER') {
            const contact = await prisma.contact.findFirst({ where: { user_id: user.id } });
            if (!contact) {
                return {
                    data: [],
                    pagination: { page: Number(page), limit: Number(limit), total: 0, totalPages: 0 }
                };
            }
            where.contact_id = contact.id;
        }

        if (type && type !== 'all') where.payment_type = type.toUpperCase();
        if (mode && mode !== 'all') where.payment_method = mode.toUpperCase();

        if (search) {
            where.OR = [
                { payment_number: { contains: search, mode: 'insensitive' } },
                { contact: { name: { contains: search, mode: 'insensitive' } } },
                { reference_number: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                include: {
                    contact: true,
                    allocations: true
                },
                skip: (page - 1) * limit,
                take: Number(limit),
                orderBy: { created_at: 'desc' }
            }),
            prisma.payment.count({ where })
        ]);

        // Fetch Bill/Invoice Numbers manually
        const billIds = [...new Set(payments.flatMap(p => p.allocations || []).filter(a => a.invoice_type === 'VENDOR_BILL').map(a => a.invoice_id))];
        const invIds = [...new Set(payments.flatMap(p => p.allocations || []).filter(a => a.invoice_type === 'CUSTOMER_INVOICE').map(a => a.invoice_id))];

        const bills = billIds.length > 0 ? await prisma.vendorBill.findMany({
            where: { id: { in: billIds } },
            select: { id: true, bill_number: true }
        }) : [];

        const invoices = invIds.length > 0 ? await prisma.customerInvoice.findMany({
            where: { id: { in: invIds } },
            select: { id: true, invoice_number: true }
        }) : [];

        const billMap = bills.reduce((acc, b) => ({ ...acc, [b.id]: b.bill_number }), {});
        const invMap = invoices.reduce((acc, i) => ({ ...acc, [i.id]: i.invoice_number }), {});

        return {
            data: payments.map(p => {
                const billId = p.allocations.find(a => a.invoice_type === 'VENDOR_BILL')?.invoice_id;
                const invId = p.allocations.find(a => a.invoice_type === 'CUSTOMER_INVOICE')?.invoice_id;

                return {
                    id: p.id,
                    amount: Number(p.amount),
                    paymentMode: p.payment_method,
                    paymentDate: p.payment_date,
                    referenceId: p.reference_number || p.razorpay_payment_id,
                    paymentType: p.payment_type,
                    status: p.status,
                    contactName: p.contact?.name,
                    allocations: p.allocations,
                    billNumber: billId ? billMap[billId] : null,
                    invoiceNumber: invId ? invMap[invId] : null
                };
            }),
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getPaymentById(id) {
        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                contact: true,
                allocations: true
            }
        });
        if (!payment) throw new Error('Payment not found');

        const billId = payment.allocations.find(a => a.invoice_type === 'VENDOR_BILL')?.invoice_id;
        const invId = payment.allocations.find(a => a.invoice_type === 'CUSTOMER_INVOICE')?.invoice_id;

        let billNumber = null;
        let invoiceNumber = null;

        if (billId) {
            const bill = await prisma.vendorBill.findUnique({ where: { id: billId }, select: { bill_number: true } });
            billNumber = bill?.bill_number;
        }
        if (invId) {
            const inv = await prisma.customerInvoice.findUnique({ where: { id: invId }, select: { invoice_number: true } });
            invoiceNumber = inv?.invoice_number;
        }

        return { ...payment, billNumber, invoiceNumber };
    }

    // Manual Payment (Cash, Bank Transfer, etc.) for Invoices or Bills
    async createManualPayment(data, userId) {
        const {
            paymentDate,
            paymentType, // INCOMING or OUTGOING
            paymentMethod,
            amount,
            contactId,
            referenceNumber, // Cheque no, Transaction ID
            notes,
            invoiceId, // Optional: if paying specific invoice/bill directly
            invoiceType // CUSTOMER_INVOICE or VENDOR_BILL
        } = data;

        const result = await prisma.$transaction(async (tx) => {
            // Generate Payment Number
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const count = await tx.payment.count({
                where: { payment_number: { startsWith: `PAY-${dateStr}` } }
            });
            const paymentNumber = `PAY-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

            // Create Payment Header
            const payment = await tx.payment.create({
                data: {
                    payment_number: paymentNumber,
                    payment_date: new Date(paymentDate),
                    payment_type: paymentType,
                    payment_method: paymentMethod,
                    amount: parseFloat(amount),
                    contact_id: contactId,
                    reference_number: referenceNumber,
                    notes: notes,
                    status: 'SUCCESS', // Manual payments are considered done
                    created_by: userId
                }
            });

            // Allocation Logic
            if (invoiceId && invoiceType) {
                await this._allocatePaymentToDocument(tx, payment.id, invoiceId, invoiceType, parseFloat(amount), userId);
            }

            // TODO: Journal Entry Logic here if needed


            return payment;
        });

        // Trigger Budget Recalculation for target Invoice/Bill
        // Should we assume the payment was successful? Yes it says SUCCESS.
        if (invoiceId && invoiceType) {
            await this._triggerBudgetRecalc(invoiceId, invoiceType);
        }

        return result;
    }

    // Helper to allocate payment and update document status
    async _allocatePaymentToDocument(tx, paymentId, docId, docType, amount, userId) {
        // Create Allocation Record
        await tx.paymentAllocation.create({
            data: {
                payment_id: paymentId,
                invoice_type: docType,
                invoice_id: docId,
                allocated_amount: amount
            }
        });

        if (docType === 'VENDOR_BILL') {
            const bill = await tx.vendorBill.findUnique({ where: { id: docId } });
            if (!bill) throw new Error('Vendor Bill not found');

            const newPaid = Number(bill.paid_amount) + amount;
            const newRemaining = Number(bill.total_amount) - newPaid;
            let newStatus = 'PARTIALLY_PAID';
            if (Math.abs(newRemaining) < 0.01) newStatus = 'PAID';

            await tx.vendorBill.update({
                where: { id: docId },
                data: {
                    paid_amount: newPaid,
                    remaining_amount: newRemaining,
                    payment_status: newStatus
                }
            });
        }
        else if (docType === 'CUSTOMER_INVOICE') {
            const inv = await tx.customerInvoice.findUnique({ where: { id: docId } });
            if (!inv) throw new Error('Invoice not found');

            const newPaid = Number(inv.paid_amount) + amount;
            const newRemaining = Number(inv.total_amount) - newPaid;
            let newStatus = 'PARTIALLY_PAID';
            if (Math.abs(newRemaining) < 0.01) newStatus = 'PAID';

            await tx.customerInvoice.update({
                where: { id: docId },
                data: {
                    paid_amount: newPaid,
                    remaining_amount: newRemaining,
                    payment_status: newStatus
                }
            });
        }
    }

    /**
     * Initialize Payment Process (Razorpay - Incoming only)
     */
    async createPaymentOrder(userId, invoiceId, amount) {
        // ... (Keep existing logic, omitted for brevity if no change needed, but I should probably include it to be safe or just append)
        // I will copy existing logic to ensure it's not lost
        const invoice = await prisma.customerInvoice.findUnique({
            where: { id: invoiceId },
            include: { customer: true }
        });

        if (!invoice) throw new Error('Invoice not found');
        if (invoice.payment_status === 'PAID') throw new Error('Invoice is already paid');
        if (Number(amount) > Number(invoice.remaining_amount)) throw new Error(`Amount exceeds remaining balance`);

        const amountInPaise = Math.round(amount * 100);
        const order = await razorpayService.createOrder(amountInPaise, invoice.invoice_number);

        return {
            order_id: order.id,
            amount: amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
            customer_name: invoice.customer.name,
            customer_email: invoice.customer.email,
            customer_phone: invoice.customer.phone
        };
    }

    async verifyAndRecordPayment(userId, paymentData) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoice_id, amount } = paymentData;

        const isValid = razorpayService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        if (!isValid) throw new Error('Invalid payment signature');

        const payment = await prisma.$transaction(async (tx) => {
            const invoice = await tx.customerInvoice.findUnique({ where: { id: invoice_id } });
            if (!invoice) throw new Error('Invoice not found');

            // Generate Payment Number
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const count = await tx.payment.count({ where: { payment_number: { startsWith: `PAY-${dateStr}` } } });
            const paymentNumber = `PAY-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

            const newPayment = await tx.payment.create({
                data: {
                    payment_number: paymentNumber,
                    payment_date: new Date(),
                    payment_type: 'INCOMING',
                    payment_method: 'RAZORPAY',
                    amount: parseFloat(amount),
                    contact_id: invoice.customer_id,
                    razorpay_payment_id,
                    razorpay_order_id,
                    status: 'SUCCESS',
                    created_by: userId
                }
            });

            await this._allocatePaymentToDocument(tx, newPayment.id, invoice_id, 'CUSTOMER_INVOICE', parseFloat(amount), userId);

            return newPayment;
        });

        // Trigger Budget Recalculation
        await this._triggerBudgetRecalc(invoice_id, 'CUSTOMER_INVOICE');

        return payment;
    }

    async _triggerBudgetRecalc(docId, docType) {
        try {
            if (docType === 'VENDOR_BILL') {
                const doc = await prisma.vendorBill.findUnique({
                    where: { id: docId },
                    include: { items: true }
                });
                if (doc && doc.items) {
                    const uniqueCostCenters = [...new Set(doc.items.map(i => i.analytical_account_id).filter(Boolean))];
                    for (const ccId of uniqueCostCenters) {
                        await budgetService.recalculateRelevantBudgets(ccId, doc.bill_date);
                    }
                }
            } else if (docType === 'CUSTOMER_INVOICE') {
                const doc = await prisma.customerInvoice.findUnique({
                    where: { id: docId },
                    include: { items: true }
                });
                if (doc && doc.items) {
                    const uniqueCostCenters = [...new Set(doc.items.map(i => i.analytical_account_id).filter(Boolean))];
                    for (const ccId of uniqueCostCenters) {
                        await budgetService.recalculateRelevantBudgets(ccId, doc.invoice_date);
                    }
                }
            }
        } catch (error) {
            console.error('Error triggering budget recalc:', error);
        }
    }
}

module.exports = new PaymentService();
