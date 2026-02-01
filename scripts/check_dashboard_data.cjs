const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkDashboardData() {
    console.log('=== Checking Dashboard Data ===\n');

    // Check Sales Orders
    const salesOrders = await prisma.salesOrder.findMany({
        where: { status: { in: ['CONFIRMED', 'DELIVERED'] } },
        select: { so_number: true, total_amount: true, status: true }
    });
    console.log(`✓ Sales Orders (Confirmed/Delivered): ${salesOrders.length}`);
    if (salesOrders.length > 0) {
        const total = salesOrders.reduce((sum, so) => sum + Number(so.total_amount), 0);
        console.log(`  Total Sales: ₹${total.toLocaleString()}`);
    }

    // Check Purchase Orders
    const purchaseOrders = await prisma.purchaseOrder.findMany({
        where: { status: 'CONFIRMED' },
        select: { po_number: true, total_amount: true }
    });
    console.log(`\n✓ Purchase Orders (Confirmed): ${purchaseOrders.length}`);
    if (purchaseOrders.length > 0) {
        const total = purchaseOrders.reduce((sum, po) => sum + Number(po.total_amount), 0);
        console.log(`  Total Purchases: ₹${total.toLocaleString()}`);
    }

    // Check Customer Invoices
    const invoices = await prisma.customerInvoice.findMany({
        where: {
            payment_status: { in: ['NOT_PAID', 'PARTIALLY_PAID'] },
            status: { in: ['POSTED', 'PARTIALLY_PAID'] }
        },
        select: { invoice_number: true, remaining_amount: true }
    });
    console.log(`\n✓ Unpaid Customer Invoices: ${invoices.length}`);
    if (invoices.length > 0) {
        const total = invoices.reduce((sum, inv) => sum + Number(inv.remaining_amount), 0);
        console.log(`  Outstanding Receivables: ₹${total.toLocaleString()}`);
    }

    // Check Vendor Bills
    const bills = await prisma.vendorBill.findMany({
        where: {
            payment_status: { in: ['NOT_PAID', 'PARTIALLY_PAID'] },
            status: { in: ['POSTED', 'PARTIALLY_PAID'] }
        },
        select: { bill_number: true, remaining_amount: true }
    });
    console.log(`\n✓ Unpaid Vendor Bills: ${bills.length}`);
    if (bills.length > 0) {
        const total = bills.reduce((sum, bill) => sum + Number(bill.remaining_amount), 0);
        console.log(`  Outstanding Payables: ₹${total.toLocaleString()}`);
    }

    // Check Vendor Bill Items with Cost Centers (for Expense Distribution)
    const billItemsWithCC = await prisma.vendorBillItem.findMany({
        where: {
            analytical_account_id: { not: null },
            vendor_bill: {
                status: { in: ['POSTED', 'PAID', 'PARTIALLY_PAID'] }
            }
        },
        include: {
            analytical_account: true,
            vendor_bill: true
        }
    });
    console.log(`\n✓ Vendor Bill Items with Cost Centers: ${billItemsWithCC.length}`);

    if (billItemsWithCC.length === 0) {
        console.log('\n⚠️  WARNING: No vendor bill items have cost centers assigned!');
        console.log('   This is why "Expense Distribution" chart shows "No budget data yet"');
        console.log('\n   To fix this:');
        console.log('   1. Create/Confirm Purchase Orders');
        console.log('   2. Create Vendor Bills from Purchase Orders');
        console.log('   3. Ensure bill items have cost centers assigned');
        console.log('   4. Post the vendor bills (change status to POSTED)');
    } else {
        const grouped = {};
        billItemsWithCC.forEach(item => {
            const ccName = item.analytical_account?.name || 'Unknown';
            if (!grouped[ccName]) grouped[ccName] = 0;
            grouped[ccName] += Number(item.total_amount);
        });
        console.log('\n  Expense by Cost Center:');
        Object.entries(grouped).forEach(([name, amount]) => {
            console.log(`    - ${name}: ₹${amount.toLocaleString()}`);
        });
    }

    // Check Budgets
    const budgets = await prisma.budget.findMany({
        include: { analytical_account: true }
    });
    console.log(`\n✓ Budgets: ${budgets.length}`);
    if (budgets.length > 0) {
        budgets.forEach(b => {
            console.log(`  - ${b.name} (${b.analytical_account?.name}): ₹${Number(b.budgeted_amount).toLocaleString()} planned, ₹${Number(b.actual_amount || 0).toLocaleString()} actual`);
        });
    }

    // Check Cost Centers
    const costCenters = await prisma.analyticalAccount.findMany({
        where: { status: 'ACTIVE' }
    });
    console.log(`\n✓ Active Cost Centers: ${costCenters.length}`);
    costCenters.forEach(cc => {
        console.log(`  - ${cc.name}`);
    });

    console.log('\n=== Summary ===');
    console.log(`Sales Orders: ${salesOrders.length}`);
    console.log(`Purchase Orders: ${purchaseOrders.length}`);
    console.log(`Customer Invoices (Unpaid): ${invoices.length}`);
    console.log(`Vendor Bills (Unpaid): ${bills.length}`);
    console.log(`Vendor Bill Items with Cost Centers: ${billItemsWithCC.length}`);
    console.log(`Budgets: ${budgets.length}`);
    console.log(`Cost Centers: ${costCenters.length}`);

    await prisma.$disconnect();
}

checkDashboardData().catch(console.error);
