const prisma = require('../config/database');

class PurchaseOrderService {
    async createPurchaseOrder(data, userId) {
        // Generate PO Number if not exists
        let poNumber = data.poNumber;
        if (!poNumber) {
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const count = await prisma.purchaseOrder.count({
                where: { po_number: { startsWith: `PO-${date}` } }
            });
            poNumber = `PO-${date}-${(count + 1).toString().padStart(4, '0')}`;
        }

        // Calculate totals
        let subtotal = 0;
        let taxAmount = 0;

        const itemsToCreate = data.items.map(item => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unitPrice) || 0;
            const itemTaxRate = Number(item.taxRate || item.tax_rate) || 18;
            const itemSubtotal = qty * price;
            const itemTax = itemSubtotal * (itemTaxRate / 100);

            subtotal += itemSubtotal;
            taxAmount += itemTax;

            return {
                product_id: item.productId,
                quantity: Number(qty.toFixed(2)),
                unit_price: Number(price.toFixed(2)),
                tax_rate: Number(itemTaxRate.toFixed(2)),
                tax_amount: Number(itemTax.toFixed(2)),
                total_amount: Number((itemSubtotal + itemTax).toFixed(2)),
                analytical_account_id: item.costCenterId || null
            };
        });

        const totalAmount = subtotal + taxAmount;

        const po = await prisma.purchaseOrder.create({
            data: {
                po_number: poNumber,
                vendor_id: data.vendorId,
                order_date: new Date(data.orderDate),
                expected_delivery_date: data.expectedDate ? new Date(data.expectedDate) : null,
                status: 'DRAFT',
                subtotal,
                tax_amount: taxAmount,
                total_amount: totalAmount,
                notes: data.notes,
                created_by: userId,
                items: {
                    create: itemsToCreate
                }
            },
            include: {
                items: {
                    include: { product: true, analytical_account: true }
                },
                vendor: true
            }
        });

        return {
            id: po.id,
            orderNumber: po.po_number,
            status: po.status,
            total: Number(po.total_amount)
        };
    }

    async getPurchaseOrders(filters = {}) {
        const { search, status, vendorId, page = 1, limit = 20 } = filters;
        const where = {};

        if (status && status !== 'all') where.status = status.toUpperCase();
        if (vendorId && vendorId !== 'all') where.vendor_id = vendorId;

        if (search) {
            where.OR = [
                { po_number: { contains: search, mode: 'insensitive' } },
                { vendor: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [orders, total] = await Promise.all([
            prisma.purchaseOrder.findMany({
                where,
                include: {
                    vendor: true,
                    items: true
                },
                skip: (page - 1) * limit,
                take: Number(limit),
                orderBy: { created_at: 'desc' }
            }),
            prisma.purchaseOrder.count({ where })
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

    async getPurchaseOrderById(id) {
        const po = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                vendor: true,
                items: {
                    include: { product: true, analytical_account: true }
                },
                vendor_bills: true
            }
        });
        if (!po) {
            const error = new Error('Purchase Order not found');
            error.statusCode = 404;
            throw error;
        }
        return po;
    }

    async updatePurchaseOrder(id, data, userId) {
        const existingPO = await this.getPurchaseOrderById(id);

        if (existingPO.status !== 'DRAFT' && data.status === undefined) {
            // Only allow status updates if not draft, generally speaking
            // But strict requirement might vary. For now, let's allow updating fields if still DRAFT.
        }

        // Using transaction to handle item updates properly (delete all and recreate is simplest for MVP)
        // Ideally we should diff, but for now full replace is safer for consistency

        let updateData = {};
        if (data.vendorId) updateData.vendor_id = data.vendorId;
        if (data.orderDate) updateData.order_date = new Date(data.orderDate);
        if (data.expectedDate) updateData.expected_delivery_date = new Date(data.expectedDate);
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.status) updateData.status = data.status.toUpperCase();

        // Recalculate if items provided
        if (data.items) {
            let subtotal = 0;
            let taxAmount = 0;

            const itemsToCreate = data.items.map(item => {
                const qty = Number(item.quantity) || 0;
                const price = Number(item.unitPrice) || 0;
                const itemTaxRate = Number(item.taxRate || item.tax_rate) || 18;
                const itemSubtotal = qty * price;
                const itemTax = itemSubtotal * (itemTaxRate / 100);

                subtotal += itemSubtotal;
                taxAmount += itemTax;

                return {
                    product_id: item.productId,
                    quantity: Number(qty.toFixed(2)),
                    unit_price: Number(price.toFixed(2)),
                    tax_rate: Number(itemTaxRate.toFixed(2)),
                    tax_amount: Number(itemTax.toFixed(2)),
                    total_amount: Number((itemSubtotal + itemTax).toFixed(2)),
                    analytical_account_id: item.costCenterId || null
                };
            });

            updateData.subtotal = subtotal;
            updateData.tax_amount = taxAmount;
            updateData.total_amount = subtotal + taxAmount;

            // Transactional update
            return await prisma.$transaction(async (prisma) => {
                // Delete existing items
                await prisma.purchaseOrderItem.deleteMany({ where: { purchase_order_id: id } });

                // Update PO and create new items
                return await prisma.purchaseOrder.update({
                    where: { id },
                    data: {
                        ...updateData,
                        items: {
                            create: itemsToCreate
                        }
                    },
                    include: {
                        items: { include: { product: true, analytical_account: true } },
                        vendor: true
                    }
                });
            });
        } else {
            return await prisma.purchaseOrder.update({
                where: { id },
                data: updateData,
                include: {
                    items: { include: { product: true, analytical_account: true } },
                    vendor: true
                }
            });
        }
    }

    async deletePurchaseOrder(id) {
        // Only allow deleting DRAFT or CANCELLED?
        const po = await prisma.purchaseOrder.findUnique({ where: { id } });
        if (po.status === 'CONFIRMED') {
            throw new Error('Cannot delete a confirmed Purchase Order. Cancel it instead.');
        }
        return await prisma.purchaseOrder.delete({ where: { id } });
    }
}

module.exports = new PurchaseOrderService();
