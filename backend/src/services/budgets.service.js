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

        const budgetsWithActuals = await Promise.all(budgets.map(async (b) => {
            const actuals = await this.calculateActuals(b.analytical_account_id, b.start_date, b.end_date, b.type);
            const planned = Number(b.budgeted_amount);
            const actual = Number(actuals);
            const remaining = planned - actual;
            const percentage = planned > 0 ? Math.round((actual / planned) * 100) : 0;

            let status = 'under_budget';
            if (actual > planned) status = 'over_budget';
            else if (percentage >= 80) status = 'near_limit';

            return {
                ...b,
                plannedAmount: Number(b.budgeted_amount),
                actualAmount: actual,
                remainingBalance: remaining,
                achievementPercentage: percentage,
                status: status, // Computed status (over/under)
                stage: b.status.toLowerCase(), // Lifecycle status (draft/active)
                costCenterName: b.analytical_account?.name,
                costCenterId: b.analytical_account_id,
                periodStart: b.start_date,
                periodEnd: b.end_date,
                version: b.revision_number
            };
        }));

        return {
            data: budgetsWithActuals,
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

        const { total: actuals, transactions } = await this.getActualsWithTransactions(b.analytical_account_id, b.start_date, b.end_date, b.type);
        const planned = Number(b.budgeted_amount);
        const actual = Number(actuals);

        return {
            ...b,
            plannedAmount: planned,
            actualAmount: actual,
            remainingBalance: planned - actual,
            achievementPercentage: planned > 0 ? Math.round((actual / planned) * 100) : 0,
            status: actual > planned ? 'over_budget' : (actual / planned >= 0.8 ? 'near_limit' : 'under_budget'),
            stage: b.status.toLowerCase(),
            costCenterName: b.analytical_account?.name,
            costCenterId: b.analytical_account_id,
            periodStart: b.start_date,
            periodEnd: b.end_date,
            version: b.revision_number,
            transactions // Return the list of contributing transactions
        };
    }

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
        // Lightweight version just for totals
        const { total } = await this.getActualsWithTransactions(costCenterId, startDate, endDate, type, false);
        return total;
    }

    async getActualsWithTransactions(costCenterId, startDate, endDate, type, includeTransactions = true) {
        // Income -> Sales Invoices (CustomerInvoiceItem)
        // Expense -> Vendor Bills (VendorBillItem)

        let total = 0;
        let transactions = [];

        if (type === 'INCOME') {
            const where = {
                analytical_account_id: costCenterId,
                customer_invoice: {
                    invoice_date: { gte: startDate, lte: endDate },
                    status: { in: ['POSTED', 'PAID', 'PARTIALLY_PAID'] }
                }
            };

            const agg = await prisma.customerInvoiceItem.aggregate({
                _sum: { total_amount: true },
                where
            });
            total = agg._sum.total_amount || 0;

            if (includeTransactions) {
                const items = await prisma.customerInvoiceItem.findMany({
                    where,
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
            // EXPENSE (Default)
            const where = {
                analytical_account_id: costCenterId,
                vendor_bill: {
                    bill_date: { gte: startDate, lte: endDate },
                    status: { in: ['POSTED', 'PAID', 'PARTIALLY_PAID'] }
                }
            };

            const agg = await prisma.vendorBillItem.aggregate({
                _sum: { total_amount: true },
                where
            });
            total = agg._sum.total_amount || 0;

            if (includeTransactions) {
                const items = await prisma.vendorBillItem.findMany({
                    where,
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

        return { total, transactions };
    }
}

module.exports = new BudgetService();
