const prisma = require('../backend/src/config/database');

async function debugBudgets() {
    console.log('--- Debugging Budgets ---');

    // 1. Get all Budgets
    const budgets = await prisma.budget.findMany({
        include: { analytical_account: true }
    });
    console.log(`Found ${budgets.length} budgets.`);

    for (const b of budgets) {
        console.log(`\nBudget: ${b.name} (${b.type})`);
        console.log(`  ID: ${b.id}`);
        console.log(`  Cost Center: ${b.analytical_account?.name} (${b.analytical_account_id})`);
        console.log(`  Period: ${b.start_date.toISOString().slice(0, 10)} to ${b.end_date.toISOString().slice(0, 10)}`);

        // 2. Check Matching Vendor Items
        if (b.type === 'EXPENSE') {
            const items = await prisma.vendorBillItem.findMany({
                where: {
                    analytical_account_id: b.analytical_account_id,
                    vendor_bill: {
                        bill_date: { gte: b.start_date, lte: b.end_date },
                        status: { in: ['POSTED', 'PAID', 'PARTIALLY_PAID'] }
                    }
                },
                include: { vendor_bill: true }
            });

            console.log(`  Matching Vendor Bill Items: ${items.length}`);
            let total = 0;
            items.forEach(i => {
                console.log(`    - Bill: ${i.vendor_bill.bill_number}, Date: ${i.vendor_bill.bill_date.toISOString().slice(0, 10)}, Status: ${i.vendor_bill.status}, Amount: ${i.total_amount}`);
                total += Number(i.total_amount);
            });
            console.log(`  Calculated Total: ${total}`);

            // 3. Check ANY items for this cost center, ignoring date/status
            const allItems = await prisma.vendorBillItem.findMany({
                where: { analytical_account_id: b.analytical_account_id },
                include: { vendor_bill: true }
            });
            console.log(`  [Diagnostic] Total items for this Cost Center (ignoring filters): ${allItems.length}`);
            allItems.forEach(i => console.log(`     > Status: ${i.vendor_bill.status}, Date: ${i.vendor_bill.bill_date.toISOString().slice(0, 10)}`));

        } else {
            // INCOME
            // ... similar logic for Invoice
        }
    }
}

debugBudgets()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
