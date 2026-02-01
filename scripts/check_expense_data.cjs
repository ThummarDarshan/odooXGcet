const prisma = require('../backend/src/config/database');

async function checkData() {
    try {
        console.log('=== Dashboard Data Check ===\n');

        // Check Vendor Bills with items
        const bills = await prisma.vendorBill.findMany({
            where: {
                status: { in: ['POSTED', 'PAID', 'PARTIALLY_PAID'] }
            },
            include: {
                items: {
                    include: {
                        analytical_account: true
                    }
                }
            }
        });

        console.log(`Total Vendor Bills (Posted/Paid): ${bills.length}`);

        let itemsWithCC = 0;
        let itemsWithoutCC = 0;

        bills.forEach(bill => {
            console.log(`\n  Bill: ${bill.bill_number} - Status: ${bill.status}`);
            console.log(`  Items: ${bill.items.length}`);
            bill.items.forEach(item => {
                if (item.analytical_account_id) {
                    itemsWithCC++;
                    console.log(`    ✓ Item has cost center: ${item.analytical_account?.name || item.analytical_account_id}`);
                } else {
                    itemsWithoutCC++;
                    console.log(`    ✗ Item missing cost center`);
                }
            });
        });

        console.log(`\n=== Summary ===`);
        console.log(`Vendor Bills: ${bills.length}`);
        console.log(`Items WITH cost center: ${itemsWithCC}`);
        console.log(`Items WITHOUT cost center: ${itemsWithoutCC}`);

        if (itemsWithCC === 0) {
            console.log(`\n⚠️  NO VENDOR BILL ITEMS HAVE COST CENTERS!`);
            console.log(`This is why the Expense Distribution chart is empty.`);
            console.log(`\nTo fix:`);
            console.log(`1. Go to Purchase > Purchase Orders`);
            console.log(`2. Create a new purchase order with items`);
            console.log(`3. Ensure each item has a cost center assigned`);
            console.log(`4. Confirm the purchase order`);
            console.log(`5. Create a vendor bill from the PO`);
            console.log(`6. Post the vendor bill`);
        }

        // Check Cost Centers
        const costCenters = await prisma.analyticalAccount.findMany();
        console.log(`\nCost Centers: ${costCenters.length}`);
        costCenters.forEach(cc => {
            console.log(`  - ${cc.name}`);
        });

        await prisma.$disconnect();
    } catch (error) {
        console.error('Error:', error.message);
        await prisma.$disconnect();
        process.exit(1);
    }
}

checkData();
