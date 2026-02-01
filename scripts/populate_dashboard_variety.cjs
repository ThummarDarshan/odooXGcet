const prisma = require('../backend/src/config/database');

async function createMoreSampleData() {
    try {
        console.log('=== Creating More Sample Data ===\n');

        // 1. Get admin user
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!admin) {
            console.error('✗ No admin user found.');
            return;
        }

        // 2. Get cost centers
        let manufacturing = await prisma.analyticalAccount.findFirst({
            where: { name: 'manufacturing' }
        });

        // Add one more cost center for variety
        let marketing = await prisma.analyticalAccount.findFirst({
            where: { name: 'marketing' }
        });
        if (!marketing) {
            marketing = await prisma.analyticalAccount.create({
                data: {
                    name: 'marketing',
                    code: 'MKT-001',
                    description: 'Marketing & Advertising',
                    created_by: admin.id
                }
            });
            console.log('✓ Created cost center: marketing');
        }

        // 3. Create a Customer Invoice (for Outstanding Receivables)
        let customer = await prisma.contact.findFirst({
            where: { type: 'CUSTOMER' }
        });

        if (!customer) {
            customer = await prisma.contact.create({
                data: {
                    name: 'Sample Customer',
                    email: 'customer@example.com',
                    type: 'CUSTOMER',
                    status: 'CONFIRMED'
                }
            });
            console.log('✓ Created customer: Sample Customer');
        }

        const invDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const invCount = await prisma.customerInvoice.count({
            where: { invoice_number: { startsWith: `INV-${invDateStr}` } }
        });
        const invNumber = `INV-${invDateStr}-${(invCount + 1).toString().padStart(4, '0')}`;

        const invoice = await prisma.customerInvoice.create({
            data: {
                invoice_number: invNumber,
                customer_id: customer.id,
                invoice_date: new Date(),
                due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                status: 'POSTED',
                payment_status: 'NOT_PAID',
                subtotal: 10000,
                tax_amount: 1800,
                total_amount: 11800,
                paid_amount: 0,
                remaining_amount: 11800,
                created_by: admin.id,
                items: {
                    create: [
                        {
                            product_id: (await prisma.product.findFirst()).id,
                            quantity: 1,
                            unit_price: 10000,
                            tax_rate: 18,
                            tax_amount: 1800,
                            total_amount: 11800,
                            analytical_account_id: marketing.id
                        }
                    ]
                }
            }
        });
        console.log(`✓ Created customer invoice: ${invoice.invoice_number} (₹11,800)`);

        // 4. Create a Budget (to fix "No budget data yet" and show utilization)
        const currentYear = new Date().getFullYear();
        const start = new Date(currentYear, 0, 1);
        const end = new Date(currentYear, 11, 31);

        const budgetName = `Manufacturing Budget ${currentYear}`;
        let budget = await prisma.budget.findFirst({
            where: { name: budgetName }
        });

        if (!budget) {
            budget = await prisma.budget.create({
                data: {
                    name: budgetName,
                    analytical_account_id: manufacturing.id,
                    type: 'EXPENSE',
                    start_date: start,
                    end_date: end,
                    budgeted_amount: 50000,
                    actual_amount: 5900, // Matching the bill we created earlier
                    status: 'ACTIVE',
                    revision_number: 1,
                    created_by: admin.id
                }
            });
            console.log(`✓ Created budget: ${budgetName} (₹50,000)`);
        } else {
            // Update actual if exists
            await prisma.budget.update({
                where: { id: budget.id },
                data: { actual_amount: 5900 }
            });
            console.log(`✓ Updated existing budget actuals: ${budgetName}`);
        }

        console.log('\n✅ Dashboard sample data expanded!');
        await prisma.$disconnect();
    } catch (error) {
        console.error('Error:', error);
        await prisma.$disconnect();
    }
}

createMoreSampleData();
