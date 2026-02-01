const prisma = require('../config/database');

class DashboardService {
    async getMetrics() {
        // Total Sales (Posted Invoices)
        const sales = await prisma.customerInvoice.aggregate({
            _sum: { total_amount: true },
            where: { status: { in: ['POSTED', 'PAID', 'PARTIALLY_PAID'] } }
        });

        // Total Purchases (Posted Bills)
        const purchases = await prisma.vendorBill.aggregate({
            _sum: { total_amount: true },
            where: { status: { in: ['POSTED', 'PAID', 'PARTIALLY_PAID'] } }
        });

        // Outstanding Receivables (Unpaid Invoices)
        const receivables = await prisma.customerInvoice.aggregate({
            _sum: { remaining_amount: true },
            where: { status: { in: ['POSTED', 'PARTIALLY_PAID'] } }
        });

        // Outstanding Payables (Unpaid Bills)
        const payables = await prisma.vendorBill.aggregate({
            _sum: { remaining_amount: true },
            where: { status: { in: ['POSTED', 'PARTIALLY_PAID'] } }
        });

        return {
            totalSales: Number(sales._sum.total_amount || 0),
            totalPurchases: Number(purchases._sum.total_amount || 0),
            outstandingReceivables: Number(receivables._sum.remaining_amount || 0),
            outstandingPayables: Number(payables._sum.remaining_amount || 0)
        };
    }

    async getMonthlyTrends() {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1); // Start of the month 6 months ago

        // Get Monthly Revenue (Invoices)
        // Note: Prisma doesn't natively support Date Truncation in simple queries without raw SQL.
        // For simplicity/compatibility, I'll fetch raw data and aggregate in JS, 
        // or use groupBy if supported well enough (groupBy date is tricky).
        // Let's use raw query for efficiency or JS aggregation for safety.
        // Given complexity, let's fetch essential fields and aggregate in JS for now (safer across DBs).

        const invoices = await prisma.customerInvoice.findMany({
            where: {
                invoice_date: { gte: sixMonthsAgo },
                status: { in: ['POSTED', 'PAID', 'PARTIALLY_PAID'] }
            },
            select: { invoice_date: true, total_amount: true }
        });

        const bills = await prisma.vendorBill.findMany({
            where: {
                bill_date: { gte: sixMonthsAgo },
                status: { in: ['POSTED', 'PAID', 'PARTIALLY_PAID'] }
            },
            select: { bill_date: true, total_amount: true }
        });

        // Aggregate
        const trends = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Initialize last 6 months
        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            trends[key] = { month: months[d.getMonth()], revenue: 0, expenses: 0, sortKey: d.getTime() };
        }

        invoices.forEach(inv => {
            const d = new Date(inv.invoice_date);
            const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            if (trends[key]) {
                trends[key].revenue += Number(inv.total_amount);
            }
        });

        bills.forEach(bill => {
            const d = new Date(bill.bill_date);
            const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            if (trends[key]) {
                trends[key].expenses += Number(bill.total_amount);
            }
        });

        return Object.values(trends).sort((a, b) => a.sortKey - b.sortKey);
    }

    async getExpenseDistribution() {
        // Expenses by Cost Center
        // Join VendorBillItems -> AnalyticalAccount
        const distribution = await prisma.vendorBillItem.groupBy({
            by: ['analytical_account_id'],
            _sum: {
                total_amount: true
            },
            where: {
                vendor_bill: {
                    status: { in: ['POSTED', 'PAID', 'PARTIALLY_PAID'] }
                },
                analytical_account_id: { not: null }
            }
        });

        // Need to fetch account names manually since groupBy doesn't include relations
        const accountIds = distribution.map(d => d.analytical_account_id);
        const accounts = await prisma.analyticalAccount.findMany({
            where: { id: { in: accountIds } },
            select: { id: true, name: true }
        });

        const accountMap = accounts.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.name }), {});

        const data = distribution.map(d => ({
            name: accountMap[d.analytical_account_id] || 'Unknown',
            value: Number(d._sum.total_amount || 0)
        })).filter(d => d.value > 0);

        // Calculate total and add percentages
        const total = data.reduce((sum, item) => sum + item.value, 0);

        return data.map(item => ({
            ...item,
            percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
        }));
    }
}

module.exports = new DashboardService();
