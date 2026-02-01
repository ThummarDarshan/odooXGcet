const prisma = require('../config/database');

class SalesOrderService {
    async create(data, userId) {
        return await prisma.$transaction(async (tx) => {
            // 1. Generate SO Number
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const count = await tx.salesOrder.count({
                where: { so_number: { startsWith: `SO-${date}` } }
            });
            const soNumber = `SO-${date}-${(count + 1).toString().padStart(4, '0')}`;

            // 2. Calculate Totals
            let subtotal = 0;
            let tax_amount = 0;

            const items = data.items.map(item => {
                const itemTotal = Number(item.quantity) * Number(item.unit_price);
                const itemTax = itemTotal * (Number(item.tax_rate || 18) / 100);

                subtotal += itemTotal;
                tax_amount += itemTax;

                return {
                    product_id: item.product_id,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                    tax_rate: Number(item.tax_rate || 0),
                    tax_amount: itemTax,
                    total_amount: itemTotal + itemTax
                    // analytical_account_id could be added if needed
                };
            });

            // 3. Create SO
            return await tx.salesOrder.create({
                data: {
                    so_number: soNumber,
                    customer_id: data.customer_id,
                    order_date: new Date(data.order_date),
                    expected_delivery_date: data.expected_delivery_date ? new Date(data.expected_delivery_date) : null,
                    status: 'DRAFT',
                    subtotal: subtotal,
                    tax_amount: tax_amount,
                    total_amount: subtotal + tax_amount,
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
    }

    async getAll(filters = {}) {
        const { search, status, customer_id, page = 1, limit = 20 } = filters;
        const where = {};

        if (status && status !== 'all') where.status = status.toUpperCase();
        if (customer_id && customer_id !== 'all') where.customer_id = customer_id;

        if (search) {
            where.OR = [
                { so_number: { contains: search, mode: 'insensitive' } },
                { customer: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [orders, total] = await Promise.all([
            prisma.salesOrder.findMany({
                where,
                include: {
                    customer: true,
                    items: true
                },
                skip: (page - 1) * limit,
                take: Number(limit),
                orderBy: { created_at: 'desc' }
            }),
            prisma.salesOrder.count({ where })
        ]);

        return {
            data: orders,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getOne(id) {
        const order = await prisma.salesOrder.findUnique({
            where: { id },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                },
                invoices: true // Show linked invoices
            }
        });

        if (!order) throw new Error('Sales Order not found');
        return order;
    }

    async update(id, data) {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.salesOrder.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!existing) throw new Error('Sales Order not found');
            if (existing.status === 'CANCELLED') throw new Error('Cannot update cancelled order');
            // Allow update if DRAFT or CONFIRMED? Usually restrictive if CONFIRMED.
            // For now, allow but maybe warn.

            let itemsToCreate = [];
            let itemsToUpdate = [];
            let itemsToDelete = []; // Logic to delete missing items if full replace?

            // For simplicity in this iteration, we might delete all items and recreate if items are passed
            // Or use the efficient update logic. 
            // Let's go with "Delete all and Recreate" strategy for items if 'items' array is present, 
            // similar to PurchaseOrders, as it ensures clean calculation.

            if (data.items) {
                await tx.salesOrderItem.deleteMany({
                    where: { sales_order_id: id }
                });

                let subtotal = 0;
                let tax_amount = 0;

                const newItems = data.items.map(item => {
                    const itemTotal = Number(item.quantity) * Number(item.unit_price);
                    const itemTax = itemTotal * (Number(item.tax_rate || 18) / 100);

                    subtotal += itemTotal;
                    tax_amount += itemTax;

                    return {
                        sales_order_id: id,
                        product_id: item.product_id,
                        quantity: Number(item.quantity),
                        unit_price: Number(item.unit_price),
                        tax_rate: Number(item.tax_rate || 0),
                        tax_amount: itemTax,
                        total_amount: itemTotal + itemTax
                    };
                });

                await tx.salesOrderItem.createMany({ data: newItems });

                data.subtotal = subtotal;
                data.tax_amount = tax_amount;
                data.total_amount = subtotal + tax_amount;
            }

            // Update Header
            const { items, ...headerData } = data;

            // Format dates if present
            if (headerData.order_date) headerData.order_date = new Date(headerData.order_date);
            if (headerData.expected_delivery_date) headerData.expected_delivery_date = new Date(headerData.expected_delivery_date);
            if (headerData.status) headerData.status = headerData.status.toUpperCase();

            return await tx.salesOrder.update({
                where: { id },
                data: headerData,
                include: {
                    customer: true,
                    items: { include: { product: true } }
                }
            });
        });
    }

    async delete(id) {
        const order = await prisma.salesOrder.findUnique({
            where: { id },
            include: { invoices: true }
        });

        if (!order) throw new Error('Sales Order not found');
        if (order.status !== 'DRAFT' && order.status !== 'CANCELLED') {
            throw new Error('Only Draft or Cancelled orders can be deleted');
        }
        if (order.invoices.length > 0) {
            throw new Error('Cannot delete Sales Order with linked Invoices');
        }

        return await prisma.salesOrder.delete({ where: { id } });
    }
}

module.exports = new SalesOrderService();
