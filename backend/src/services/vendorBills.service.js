const prisma = require('../config/database');
const budgetService = require('./budgets.service');

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
            const itemTaxRate = Number(item.taxRate) || 18;
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

        // Trigger Budget Recalculation
        // We do this asynchronously so we don't block the response, or await if strict consistency is needed.
        // Given the user wants it "updated", await is safer.
        if (data.items && data.items.length > 0) {
            const uniqueCostCenters = [...new Set(data.items.map(i => i.costCenterId).filter(Boolean))];

            // We use the bill date for budget period matching
            const date = new Date(data.billDate);

            for (const ccId of uniqueCostCenters) {
                await budgetService.recalculateRelevantBudgets(ccId, date);
            }
        }

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
            data: bills,
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
        return bill;
    }

    async updateVendorBill(id, data, userId) {
        const existingBill = await this.getVendorBillById(id);

        let updateData = {};
        if (data.vendorId) updateData.vendor_id = data.vendorId;
        if (data.billDate) updateData.bill_date = new Date(data.billDate);
        if (data.dueDate) updateData.due_date = new Date(data.dueDate);
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.status) updateData.status = data.status.toUpperCase();

        let updatedBill;

        // If items changing
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
            if (existingBill.status === 'DRAFT') {
                updateData.remaining_amount = totalAmount;
            }

            updatedBill = await prisma.$transaction(async (tx) => {
                await tx.vendorBillItem.deleteMany({ where: { vendor_bill_id: id } });
                return await tx.vendorBill.update({
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
            updatedBill = await prisma.vendorBill.update({
                where: { id },
                data: updateData,
                include: {
                    items: { include: { product: true, analytical_account: true } },
                    vendor: true
                }
            });
        }

        // Trigger Budget Recalculation
        if (updatedBill && updatedBill.items) {
            const uniqueCostCenters = [...new Set(updatedBill.items.map(i => i.analytical_account_id).filter(Boolean))];
            const date = updatedBill.bill_date;

            for (const ccId of uniqueCostCenters) {
                // Determine effective date? 
                // Budget uses date range. Usually bill date.
                await budgetService.recalculateRelevantBudgets(ccId, date);
            }
        }

        return updatedBill;
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
