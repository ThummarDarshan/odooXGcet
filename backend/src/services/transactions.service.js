const prisma = require('../config/database');

class TransactionsService {
    async createCustomerInvoice(data, userId) {
        const { items, ...invoiceData } = data;

        // Calculate totals
        let subtotal = 0;
        let totalTax = 0;

        const processedItems = items.map(item => {
            const lineTotal = Number(item.quantity) * Number(item.unit_price);
            const tax = lineTotal * (Number(item.tax_rate || 0) / 100);

            subtotal += lineTotal;
            totalTax += tax;

            return {
                ...item,
                tax_amount: tax,
                total_amount: lineTotal + tax
            };
        });

        const totalAmount = subtotal + totalTax;

        // Generate Invoice Number
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await prisma.customerInvoice.count({
            where: { invoice_number: { startsWith: `INV-${date}` } }
        });
        const invoiceNumber = `INV-${date}-${(count + 1).toString().padStart(4, '0')}`;

        // Create Invoice with Items
        const invoice = await prisma.customerInvoice.create({
            data: {
                ...invoiceData,
                invoice_number: invoiceNumber,
                subtotal,
                tax_amount: totalTax,
                total_amount: totalAmount,
                remaining_amount: totalAmount,
                payment_status: 'NOT_PAID',
                created_by: userId,
                items: {
                    create: processedItems
                }
            },
            include: {
                items: true,
                customer: true
            }
        });

        return invoice;
    }

    async getInvoices(filters = {}) {
        return await prisma.customerInvoice.findMany({
            take: 20,
            orderBy: { created_at: 'desc' },
            include: { customer: true }
        });
    }
}

module.exports = new TransactionsService();
