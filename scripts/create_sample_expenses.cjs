const prisma = require('../backend/src/config/database');

async function createSampleExpenseData() {
    try {
        console.log('=== Creating Sample Expense Data ===\n');

        // 1. Get or create cost centers
        let manufacturing = await prisma.analyticalAccount.findFirst({
            where: { name: 'manufacturing' }
        });

        if (!manufacturing) {
            manufacturing = await prisma.analyticalAccount.create({
                data: {
                    name: 'manufacturing',
                    description: 'Manufacturing Department'
                }
            });
            console.log('✓ Created cost center: manufacturing');
        } else {
            console.log('✓ Found existing cost center: manufacturing');
        }

        // 2. Get or create a vendor
        let vendor = await prisma.contact.findFirst({
            where: { type: 'VENDOR' }
        });

        if (!vendor) {
            vendor = await prisma.contact.create({
                data: {
                    name: 'Sample Vendor Ltd',
                    email: 'vendor@example.com',
                    phone: '1234567890',
                    type: 'VENDOR',
                    status: 'CONFIRMED'
                }
            });
            console.log('✓ Created vendor: Sample Vendor Ltd');
        } else {
            console.log(`✓ Found existing vendor: ${vendor.name}`);
        }

        // 3. Get or create a product
        let product = await prisma.product.findFirst();

        if (!product) {
            product = await prisma.product.create({
                data: {
                    name: 'Raw Material',
                    category: 'materials',
                    sales_price: 100,
                    purchase_price: 80,
                    status: 'CONFIRMED'
                }
            });
            console.log('✓ Created product: Raw Material');
        } else {
            console.log(`✓ Found existing product: ${product.name}`);
        }

        // 4. Get admin user
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!admin) {
            console.error('✗ No admin user found. Please create an admin user first.');
            await prisma.$disconnect();
            return;
        }

        console.log(`✓ Found admin user: ${admin.email}`);

        // 5. Create a POSTED vendor bill with cost center
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await prisma.vendorBill.count({
            where: { bill_number: { startsWith: `BILL-${dateStr}` } }
        });
        const billNumber = `BILL-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

        const vendorBill = await prisma.vendorBill.create({
            data: {
                bill_number: billNumber,
                vendor_id: vendor.id,
                bill_date: new Date(),
                due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                status: 'POSTED', // Important: POSTED status
                payment_status: 'NOT_PAID',
                subtotal: 5000,
                tax_amount: 900,
                total_amount: 5900,
                paid_amount: 0,
                remaining_amount: 5900,
                created_by: admin.id,
                items: {
                    create: [
                        {
                            product_id: product.id,
                            quantity: 50,
                            unit_price: 80,
                            tax_rate: 18,
                            tax_amount: 720,
                            total_amount: 4720,
                            analytical_account_id: manufacturing.id // Important: Cost center assigned
                        },
                        {
                            product_id: product.id,
                            quantity: 15,
                            unit_price: 80,
                            tax_rate: 18,
                            tax_amount: 180,
                            total_amount: 1180,
                            analytical_account_id: manufacturing.id // Important: Cost center assigned
                        }
                    ]
                }
            },
            include: {
                items: {
                    include: {
                        analytical_account: true
                    }
                }
            }
        });

        console.log(`\n✓ Created vendor bill: ${vendorBill.bill_number}`);
        console.log(`  Status: ${vendorBill.status}`);
        console.log(`  Total: ₹${vendorBill.total_amount}`);
        console.log(`  Items: ${vendorBill.items.length}`);
        vendorBill.items.forEach((item, i) => {
            console.log(`    Item ${i + 1}: ₹${item.total_amount} → Cost Center: ${item.analytical_account?.name}`);
        });

        console.log('\n✅ Sample expense data created successfully!');
        console.log('\nNow refresh your dashboard to see the Expense Distribution chart.');

        await prisma.$disconnect();
    } catch (error) {
        console.error('Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

createSampleExpenseData();
