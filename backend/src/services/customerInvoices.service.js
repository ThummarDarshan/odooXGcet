const analyticalService = require('./analytical.service');
const prisma = require('../config/database');
const budgetService = require('./budgets.service');

class CustomerInvoiceService {
    async create(data, userId) {
        return await prisma.$transaction(async (tx) => {
            // 1. Generate Invoice Number
            // INV-YYYYMMDD-XXXX
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const count = await tx.customerInvoice.count({
                where: { invoice_number: { startsWith: `INV-${dateStr}` } }
            });
            const invoiceNumber = `INV-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

            // Normalize input keys (handle camelCase from frontend)
            const customerId = data.customer_id || data.customerId;
            const invoiceDate = data.invoice_date || data.invoiceDate;
            const dueDate = data.due_date || data.dueDate;
            const itemsRaw = data.items || [];

            // 1b. Fetch Product Details for Analytical Rules
            const productIds = itemsRaw.map(i => i.product_id || i.productId).filter(Boolean);
            const products = await tx.product.findMany({ where: { id: { in: productIds } } });
            const productMap = new Map(products.map(p => [p.id, p]));

            // 2. Calculate Totals & Resolve Cost Centers
            let subtotal = 0;
            let tax_amount = 0;

            const items = await Promise.all(itemsRaw.map(async item => {
                const productId = item.product_id || item.productId;
                const product = productMap.get(productId);
                const qty = Number(item.quantity) || 0;
                const price = Number(item.unit_price || item.unitPrice) || 0;
                const taxRate = Number(item.tax_rate || item.taxRate || 18);

                const itemTotal = qty * price;
                const itemTax = itemTotal * (taxRate / 100);

                subtotal += itemTotal;
                tax_amount += itemTax;

                let analyticalAccountId = item.analytical_account_id || item.costCenterId || null;

                // Auto Analytical Rule Application
                if (!analyticalAccountId && product) {
                    const autoAccount = await analyticalService.getApplicableCostCenter({
                        productId: product.id,
                        productCategory: product.category,
                        contactId: customerId
                    });
                    if (autoAccount) {
                        analyticalAccountId = autoAccount.id;
                    }
                }

                return {
                    product_id: productId,
                    quantity: qty,
                    unit_price: price,
                    tax_rate: taxRate,
                    tax_amount: itemTax,
                    total_amount: itemTotal + itemTax,
                    analytical_account_id: analyticalAccountId
                };
            }));

            // 3. Create Invoice
            const invoice = await tx.customerInvoice.create({
                data: {
                    invoice_number: invoiceNumber,
                    customer_id: customerId,
                    sales_order_id: data.sales_order_id || data.salesOrderId || null,
                    invoice_date: new Date(invoiceDate),
                    due_date: new Date(dueDate),
                    status: 'DRAFT',
                    payment_status: 'NOT_PAID',
                    subtotal: subtotal,
                    tax_amount: tax_amount,
                    total_amount: subtotal + tax_amount,
                    paid_amount: 0,
                    remaining_amount: subtotal + tax_amount,
                    notes: data.notes,
                    created_by: userId,
                    items: {
                        create: items
                    }
                },
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });

        });

        // Trigger Budget Recalculation
        // Note: transaction result 'invoice' has items included from line 91
        if (invoice && invoice.items) {
            const uniqueCostCenters = [...new Set(invoice.items.map(i => i.analytical_account_id).filter(Boolean))];
            const date = invoice.invoice_date;

            for (const ccId of uniqueCostCenters) {
                await budgetService.recalculateRelevantBudgets(ccId, date);
            }
        }

        return invoice;
    }

    async getAll(filters = {}, user = null) {
        const { search, status, payment_status, customer_id, page = 1, limit = 20 } = filters;
        const where = {};

        // Security: Restrict CUSTOMER to their own data
        if (user && user.role === 'CUSTOMER') {
            const contact = await prisma.contact.findUnique({ where: { user_id: user.id } });
            if (!contact) {
                // If no contact linked, show nothing
                return {
                    data: [],
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total: 0,
                        totalPages: 0
                    }
                };
            }
            where.customer_id = contact.id;
        } else if (customer_id && customer_id !== 'all') {
            where.customer_id = customer_id;
        }

        if (status && status !== 'all') where.status = status.toUpperCase();
        if (payment_status && payment_status !== 'all') where.payment_status = payment_status.toUpperCase();

        if (search) {
            where.OR = [
                { invoice_number: { contains: search, mode: 'insensitive' } },
                { customer: { name: { contains: search, mode: 'insensitive' } } },
                { sales_order: { so_number: { startsWith: search, mode: 'insensitive' } } }
            ];
        }

        const [invoices, total] = await Promise.all([
            prisma.customerInvoice.findMany({
                where,
                include: {
                    customer: true,
                    sales_order: true
                },
                skip: (page - 1) * limit,
                take: Number(limit),
                orderBy: { created_at: 'desc' }
            }),
            prisma.customerInvoice.count({ where })
        ]);

        return {
            data: invoices,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getOne(id) {
        const invoice = await prisma.customerInvoice.findUnique({
            where: { id },
            include: {
                customer: true,
                sales_order: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!invoice) throw new Error('Invoice not found');
        return invoice;
    }

    async update(id, data) {
        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.customerInvoice.findUnique({
                where: { id }
            });

            if (!existing) throw new Error('Invoice not found');
            if (existing.status === 'POSTED' || existing.status === 'PAID') {
                // Allow updates if transitioning to another status (like cancelling) or minor changes?
                // For now, strict as per existing logic.
                if (!data.status) throw new Error('Cannot update posted/paid invoice');
            }

            // Logic to update items...
            if (data.items) {
                await tx.customerInvoiceItem.deleteMany({ where: { customer_invoice_id: id } });

                let subtotal = 0;
                let tax_amount = 0;

                const itemsRaw = data.items;
                const productIds = itemsRaw.map(i => i.product_id || i.productId).filter(Boolean);
                const products = await tx.product.findMany({ where: { id: { in: productIds } } });
                const productMap = new Map(products.map(p => [p.id, p]));

                const newItems = await Promise.all(itemsRaw.map(async item => {
                    const productId = item.product_id || item.productId;
                    const product = productMap.get(productId);
                    const qty = Number(item.quantity) || 0;
                    const price = Number(item.unit_price || item.unitPrice) || 0;
                    const taxRate = Number(item.tax_rate || item.taxRate || 18);

                    const itemTotal = qty * price;
                    const itemTax = itemTotal * (taxRate / 100);

                    subtotal += itemTotal;
                    tax_amount += itemTax;

                    let analyticalAccountId = item.analytical_account_id || item.costCenterId || null;

                    if (!analyticalAccountId && product) {
                        const autoAccount = await analyticalService.getApplicableCostCenter({
                            productId: product.id,
                            productCategory: product.category,
                            contactId: existing.customer_id
                        });
                        if (autoAccount) {
                            analyticalAccountId = autoAccount.id;
                        }
                    }

                    return {
                        customer_invoice_id: id,
                        product_id: productId,
                        quantity: qty,
                        unit_price: price,
                        tax_rate: taxRate,
                        tax_amount: itemTax,
                        total_amount: itemTotal + itemTax,
                        analytical_account_id: analyticalAccountId
                    };
                }));

                await tx.customerInvoiceItem.createMany({ data: newItems });

                data.subtotal = subtotal;
                data.tax_amount = tax_amount;
                data.total_amount = subtotal + tax_amount;
                data.remaining_amount = data.total_amount - (Number(existing.paid_amount) || 0);
            }

            const { items, ...headerDataRaw } = data;
            const headerData = {};

            // Map incoming header data to snake_case
            if (headerDataRaw.customer_id || headerDataRaw.customerId) headerData.customer_id = headerDataRaw.customer_id || headerDataRaw.customerId;
            if (headerDataRaw.sales_order_id || headerDataRaw.salesOrderId) headerData.sales_order_id = headerDataRaw.sales_order_id || headerDataRaw.salesOrderId;
            if (headerDataRaw.invoice_date || headerDataRaw.invoiceDate) headerData.invoice_date = new Date(headerDataRaw.invoice_date || headerDataRaw.invoiceDate);
            if (headerDataRaw.due_date || headerDataRaw.dueDate) headerData.due_date = new Date(headerDataRaw.due_date || headerDataRaw.dueDate);
            if (headerDataRaw.status) headerData.status = headerDataRaw.status.toUpperCase();
            if (headerDataRaw.payment_status || headerDataRaw.paymentStatus) headerData.payment_status = (headerDataRaw.payment_status || headerDataRaw.paymentStatus).toUpperCase();
            if (headerDataRaw.notes !== undefined) headerData.notes = headerDataRaw.notes;
            if (headerDataRaw.subtotal !== undefined) headerData.subtotal = headerDataRaw.subtotal;
            if (headerDataRaw.tax_amount !== undefined) headerData.tax_amount = headerDataRaw.tax_amount;
            if (headerDataRaw.total_amount !== undefined) headerData.total_amount = headerDataRaw.total_amount;
            if (headerDataRaw.remaining_amount !== undefined) headerData.remaining_amount = headerDataRaw.remaining_amount;

            const updatedInvoice = await tx.customerInvoice.update({
                where: { id },
                data: headerData,
                include: { customer: true, items: true }
            });

            return updatedInvoice;
        });

        // Trigger Budget Recalculation
        if (result && result.items) {
            const uniqueCostCenters = [...new Set(result.items.map(i => i.analytical_account_id).filter(Boolean))];
            const date = result.invoice_date;

            for (const ccId of uniqueCostCenters) {
                await budgetService.recalculateRelevantBudgets(ccId, date);
            }
        }

        return result;
    }

    async delete(id) {
        const invoice = await prisma.customerInvoice.findUnique({ where: { id } });
        if (!invoice) throw new Error('Invoice not found');
        if (invoice.status === 'POSTED' || invoice.status === 'PAID' || Number(invoice.paid_amount) > 0) {
            throw new Error('Cannot delete posted or partially paid invoice');
        }
        return await prisma.customerInvoice.delete({ where: { id } });
    }
}

module.exports = new CustomerInvoiceService();
