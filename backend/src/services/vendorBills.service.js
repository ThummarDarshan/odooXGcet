const prisma = require('../config/database');

class VendorBillService {
    async createVendorBill(data, userId) {
        // Generate Bill Number if not exists
        let billNumber = data.billNumber;
        if (!billNumber) {
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const count = await prisma.vendorBill.count({
                where: { bill_number: { startsWith: `BILL-${date}` } }
            });
            billNumber = `BILL-${date}-${(count + 1).toString().padStart(4, '0')}`;
        }

        // Calculate totals
        let subtotal = 0;
        let taxAmount = 0;

        const itemsToCreate = data.items.map(item => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unitPrice) || 0;
            const itemTaxRate = Number(item.taxRate) || 0;
            const itemSubtotal = qty * price;
            const itemTax = itemSubtotal * (itemTaxRate / 100);

            subtotal += itemSubtotal;
            taxAmount += itemTax;

            return {
                product_id: item.productId,
                quantity: qty,
                unit_price: price,
                tax_rate: itemTaxRate,
                tax_amount: itemTax,
                total_amount: itemSubtotal + itemTax,
                analytical_account_id: item.costCenterId || null
            };
        });

        const totalAmount = subtotal + taxAmount;

        const bill = await prisma.vendorBill.create({
            data: {
                bill_number: billNumber,
                vendor_id: data.vendorId,
                purchase_order_id: data.purchaseOrderId || null,
                bill_date: new Date(data.billDate),
                due_date: new Date(data.dueDate),
                status: 'DRAFT',
                payment_status: 'NOT_PAID',
                subtotal,
                tax_amount: taxAmount,
                total_amount: totalAmount,
                remaining_amount: totalAmount, // Initially full amount remaining
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

        return bill;
    }

    async getVendorBills(filters = {}) {
        const { search, status, vendorId, page = 1, limit = 20 } = filters;
        const where = {};

        if (status && status !== 'all') where.status = status.toUpperCase();
        if (vendorId && vendorId !== 'all') where.vendor_id = vendorId;

        if (search) {
            where.OR = [
                { bill_number: { contains: search, mode: 'insensitive' } },
                { vendor: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [bills, total] = await Promise.all([
            prisma.vendorBill.findMany({
                where,
                include: {
                    vendor: true,
                    items: true,
                    purchase_order: true
                },
                skip: (page - 1) * limit,
                take: Number(limit),
                orderBy: { created_at: 'desc' }
            }),
            prisma.vendorBill.count({ where })
        ]);

        return {
            data: bills.map(vb => ({
                id: vb.id,
                billNumber: vb.bill_number,
                vendorId: vb.vendor_id,
                vendorName: vb.vendor?.name,
                purchaseOrderId: vb.purchase_order_id,
                purchaseOrder: vb.purchase_order ? {
                    id: vb.purchase_order.id,
                    orderNumber: vb.purchase_order.po_number
                } : null,
                billDate: vb.bill_date,
                dueDate: vb.due_date,
                status: vb.status,
                paymentStatus: vb.payment_status,
                total: Number(vb.total_amount),
                paidAmount: Number(vb.paid_amount),
                remainingAmount: Number(vb.remaining_amount),
                tax: Number(vb.tax_amount),
                subtotal: Number(vb.subtotal),
                notes: vb.notes
            })),
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getVendorBillById(id) {
        const bill = await prisma.vendorBill.findUnique({
            where: { id },
            include: {
                vendor: true,
                items: {
                    include: { product: true, analytical_account: true }
                },
                purchase_order: true
            }
        });
        if (!bill) throw new Error('Vendor Bill not found');
        return {
            id: bill.id,
            billNumber: bill.bill_number,
            vendorId: bill.vendor_id,
            vendorName: bill.vendor?.name,
            purchaseOrderId: bill.purchase_order_id,
            purchaseOrder: bill.purchase_order ? {
                id: bill.purchase_order.id,
                orderNumber: bill.purchase_order.po_number
            } : null,
            billDate: bill.bill_date,
            dueDate: bill.due_date,
            status: bill.status,
            paymentStatus: bill.payment_status,
            total: Number(bill.total_amount),
            paidAmount: Number(bill.paid_amount),
            remainingAmount: Number(bill.remaining_amount),
            tax: Number(bill.tax_amount),
            subtotal: Number(bill.subtotal),
            notes: bill.notes,
            lineItems: bill.items.map(item => ({
                id: item.id,
                productId: item.product_id,
                productName: item.product?.name,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unit_price),
                taxRate: Number(item.tax_rate),
                taxAmount: Number(item.tax_amount),
                total: Number(item.total_amount),
                costCenterId: item.analytical_account_id,
                costCenterName: item.analytical_account?.name
            }))
        };
    }

    async updateVendorBill(id, data, userId) {
        // Similar logic to PO, allow full update if Draft.
        const existingBill = await this.getVendorBillById(id);

        let updateData = {};
        if (data.vendorId) updateData.vendor_id = data.vendorId;
        if (data.billDate) updateData.bill_date = new Date(data.billDate);
        if (data.dueDate) updateData.due_date = new Date(data.dueDate);
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.status) updateData.status = data.status;

        // If items changing
        if (data.items) {
            let subtotal = 0;
            let taxAmount = 0;

            const itemsToCreate = data.items.map(item => {
                const qty = Number(item.quantity) || 0;
                const price = Number(item.unitPrice) || 0;
                const itemTaxRate = Number(item.taxRate) || 0;
                const itemSubtotal = qty * price;
                const itemTax = itemSubtotal * (itemTaxRate / 100);

                subtotal += itemSubtotal;
                taxAmount += itemTax;

                return {
                    product_id: item.productId,
                    quantity: qty,
                    unit_price: price,
                    tax_rate: itemTaxRate,
                    tax_amount: itemTax,
                    total_amount: itemSubtotal + itemTax,
                    analytical_account_id: item.costCenterId || null
                };
            });

            const totalAmount = subtotal + taxAmount;

            updateData.subtotal = subtotal;
            updateData.tax_amount = taxAmount;
            updateData.total_amount = totalAmount;

            // Recalculate remaining amount if not paid
            // Assuming we don't handle partial updates of amount if already partially paid here complexly.
            // If status is DRAFT, we can reset paid_amount to 0 if we want, or assuming it's 0.
            if (existingBill.status === 'DRAFT') {
                updateData.remaining_amount = totalAmount;
            }

            return await prisma.$transaction(async (prisma) => {
                await prisma.vendorBillItem.deleteMany({ where: { vendor_bill_id: id } });
                return await prisma.vendorBill.update({
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
            return await prisma.vendorBill.update({
                where: { id },
                data: updateData,
                include: {
                    items: { include: { product: true, analytical_account: true } },
                    vendor: true
                }
            });
        }
    }

    async deleteVendorBill(id) {
        // Prevent delete if Posted/Paid?
        const bill = await prisma.vendorBill.findUnique({ where: { id } });
        if (['POSTED', 'PAID', 'PARTIALLY_PAID'].includes(bill.status)) {
            throw new Error('Cannot delete a posted or paid bill.');
        }
        return await prisma.vendorBill.delete({ where: { id } });
    }
}

module.exports = new VendorBillService();
