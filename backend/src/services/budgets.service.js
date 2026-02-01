const prisma = require('../config/database');

class BudgetService {
    async createBudget(data, userId) {
        const budget = await prisma.budget.create({
            data: {
                name: data.name,
                analytical_account_id: data.costCenterId,
                type: data.type || 'EXPENSE',
                start_date: new Date(data.periodStart),
                end_date: new Date(data.periodEnd),
                budgeted_amount: data.plannedAmount,
                description: data.description,
                parent_budget_id: data.parent_budget_id,
                revision_number: data.revision_number || 0,
                status: 'ACTIVE',
                created_by: userId
            }
        });
        return this.getBudgetById(budget.id);
    }

    async getBudgets(filters = {}) {
        const { search, page = 1, limit = 20 } = filters;
        const where = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { analytical_account: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [budgets, total] = await Promise.all([
            prisma.budget.findMany({
                where,
                include: { analytical_account: true },
                skip: (page - 1) * limit,
                take: Number(limit),
                orderBy: { created_at: 'desc' }
            }),
            prisma.budget.count({ where })
        ]);

        const mappedBudgets = budgets.map(b => {
            // Use stored values
            const planned = Number(b.budgeted_amount);
            const actualVal = Number(b.actual_amount || 0);
            const reservedVal = Number(b.reserved_amount || 0);
            const remaining = planned - actualVal;
            const percentage = planned > 0 ? Math.round((actualVal / planned) * 100) : 0;

            let status = 'under_budget';
            if (actualVal > planned) status = 'over_budget';
            else if (percentage >= 80) status = 'near_limit';

            return {
                ...b,
                plannedAmount: planned,
                actualAmount: actualVal,
                reservedAmount: reservedVal,
                remainingBalance: remaining,
                achievementPercentage: percentage,
                status: status,
                stage: b.status.toLowerCase(),
                costCenterName: b.analytical_account?.name,
                costCenterId: b.analytical_account_id,
                periodStart: b.start_date,
                periodEnd: b.end_date,
                version: b.revision_number
            };
        });

        return {
            data: mappedBudgets,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getBudgetById(id) {
        const b = await prisma.budget.findUnique({
            where: { id },
            include: { analytical_account: true }
        });

        if (!b) throw new Error('Budget not found');

        // Return transactions list on detail view, but use stored totals
        // We still calculate transactions list dynamically for now
        const { transactions } = await this.getActualsWithTransactions(b.analytical_account_id, b.start_date, b.end_date, b.type, true);

        const planned = Number(b.budgeted_amount);
        const actual = Number(b.actual_amount || 0);
        const reserved = Number(b.reserved_amount || 0);

        return {
            ...b,
            plannedAmount: planned,
            actualAmount: actual,
            reservedAmount: reserved,
            remainingBalance: planned - actual,
            achievementPercentage: planned > 0 ? Math.round((actual / planned) * 100) : 0,
            status: actual > planned ? 'over_budget' : (actual / planned >= 0.8 ? 'near_limit' : 'under_budget'),
            stage: b.status.toLowerCase(),
            costCenterName: b.analytical_account?.name,
            costCenterId: b.analytical_account_id,
            periodStart: b.start_date,
            periodEnd: b.end_date,
            version: b.revision_number,
            transactions
        };
    }

    // ... (create/update/delete existing methods) ... 

    // New Methods for Recalculation
    async recalculateBudget(id) {
        const b = await prisma.budget.findUnique({ where: { id } });
        if (!b) return;

        const { actual, reserved } = await this.calculateActuals(b.analytical_account_id, b.start_date, b.end_date, b.type);

        await prisma.budget.update({
            where: { id },
            data: {
                actual_amount: actual,
                reserved_amount: reserved
            }
        });
    }

    async recalculateRelevantBudgets(costCenterId, date) {
        if (!costCenterId || !date) return;
        const targetDate = new Date(date);

        // Find budgets that cover this date and cost center
        const budgets = await prisma.budget.findMany({
            where: {
                analytical_account_id: costCenterId,
                start_date: { lte: targetDate },
                end_date: { gte: targetDate }
            }
        });

        for (const b of budgets) {
            await this.recalculateBudget(b.id);
        }
    }

    async recalculateAllBudgets() {
        const budgets = await prisma.budget.findMany({ select: { id: true } });
        for (const b of budgets) {
            await this.recalculateBudget(b.id);
        }
    }

    // ... (rest of class) ...

    async updateBudget(id, data) {
        const updateData = {};
        if (data.name) updateData.name = data.name;
        if (data.costCenterId) updateData.analytical_account_id = data.costCenterId;
        if (data.type) updateData.type = data.type;
        if (data.periodStart) updateData.start_date = new Date(data.periodStart);
        if (data.periodEnd) updateData.end_date = new Date(data.periodEnd);
        if (data.plannedAmount) updateData.budgeted_amount = data.plannedAmount;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.status) updateData.status = data.status;

        await prisma.budget.update({ where: { id }, data: updateData });
        return this.getBudgetById(id);
    }

    async deleteBudget(id) {
        return await prisma.budget.delete({ where: { id } });
    }

    async calculateActuals(costCenterId, startDate, endDate, type) {
        const { total, reserved } = await this.getActualsWithTransactions(costCenterId, startDate, endDate, type, false);
        return { actual: total, reserved };
    }

    async getActualsWithTransactions(costCenterId, startDate, endDate, type, includeTransactions = true) {
        let total = 0;
        let reserved = 0;
        let transactions = [];

        if (type === 'INCOME') {
            const baseWhere = {
                analytical_account_id: costCenterId,
                customer_invoice: {
                    invoice_date: { gte: startDate, lte: endDate }
                }
            };

            // Realized (Posted OR Paid)
            const aggActual = await prisma.customerInvoiceItem.aggregate({
                _sum: { total_amount: true },
                where: {
                    ...baseWhere,
                    customer_invoice: {
                        ...baseWhere.customer_invoice,
                        OR: [
                            { status: 'POSTED' },
                            { payment_status: { in: ['PAID', 'PARTIALLY_PAID'] } }
                        ]
                    }
                }
            });
            total = aggActual._sum.total_amount || 0;

            // Reserved (Draft AND Not Paid)
            const aggReserved = await prisma.customerInvoiceItem.aggregate({
                _sum: { total_amount: true },
                where: {
                    ...baseWhere,
                    customer_invoice: {
                        ...baseWhere.customer_invoice,
                        status: 'DRAFT',
                        payment_status: 'NOT_PAID'
                    }
                }
            });
            reserved = aggReserved._sum.total_amount || 0;

            if (includeTransactions) {
                const items = await prisma.customerInvoiceItem.findMany({
                    where: {
                        ...baseWhere,
                        customer_invoice: {
                            ...baseWhere.customer_invoice,
                            OR: [
                                { status: 'POSTED' },
                                { payment_status: { in: ['PAID', 'PARTIALLY_PAID'] } }
                            ]
                        }
                    },
                    include: { customer_invoice: { include: { customer: true } } },
                    orderBy: { customer_invoice: { invoice_date: 'desc' } }
                });
                transactions = items.map(item => ({
                    id: item.customer_invoice.id,
                    date: item.customer_invoice.invoice_date,
                    reference: item.customer_invoice.invoice_number,
                    partner: item.customer_invoice.customer.name,
                    amount: Number(item.total_amount),
                    type: 'Customer Invoice'
                }));
            }
        } else {
            // EXPENSE
            const baseWhere = {
                analytical_account_id: costCenterId,
                vendor_bill: {
                    bill_date: { gte: startDate, lte: endDate }
                }
            };

            // Realized
            const aggActual = await prisma.vendorBillItem.aggregate({
                _sum: { total_amount: true },
                where: {
                    ...baseWhere,
                    vendor_bill: {
                        ...baseWhere.vendor_bill,
                        OR: [
                            { status: 'POSTED' },
                            { payment_status: { in: ['PAID', 'PARTIALLY_PAID'] } }
                        ]
                    }
                }
            });
            total = aggActual._sum.total_amount || 0;

            // Reserved
            const aggReserved = await prisma.vendorBillItem.aggregate({
                _sum: { total_amount: true },
                where: {
                    ...baseWhere,
                    vendor_bill: {
                        ...baseWhere.vendor_bill,
                        status: 'DRAFT',
                        payment_status: 'NOT_PAID'
                    }
                }
            });
            reserved = aggReserved._sum.total_amount || 0;

            if (includeTransactions) {
                const items = await prisma.vendorBillItem.findMany({
                    where: {
                        ...baseWhere,
                        vendor_bill: {
                            ...baseWhere.vendor_bill,
                            OR: [
                                { status: 'POSTED' },
                                { payment_status: { in: ['PAID', 'PARTIALLY_PAID'] } }
                            ]
                        }
                    },
                    include: { vendor_bill: { include: { vendor: true } } },
                    orderBy: { vendor_bill: { bill_date: 'desc' } }
                });
                transactions = items.map(item => ({
                    id: item.vendor_bill.id,
                    date: item.vendor_bill.bill_date,
                    reference: item.vendor_bill.bill_number,
                    partner: item.vendor_bill.vendor.name,
                    amount: Number(item.total_amount),
                    type: 'Vendor Bill'
                }));
            }
        }

        return { total, reserved, transactions };
    }
}

module.exports = new BudgetService();
