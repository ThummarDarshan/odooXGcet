const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    // 1. Create a User (if not exists) to be the creator
    let user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!user) {
        console.log('No Admin user found. Please run seed.js first or register a user.');
        return;
    }

    console.log(`Using User ID: ${user.id}`);

    // 2. Create a Customer Contact
    const customer = await prisma.contact.create({
        data: {
            type: 'CUSTOMER',
            name: 'Test Customer',
            email: 'customer@test.com',
            phone: '1234567890',
            address: '123 Test Lane',
            created_by: user.id
        }
    });
    console.log(`\n✅ Created Contact: ${customer.name}`);
    console.log(`👉 customer_id: ${customer.id}`);

    // 3. Create a Product
    const product = await prisma.product.create({
        data: {
            name: 'Test Widget',
            category: 'General',
            unit_price: 100.00,
            cost_price: 50.00,
            sku: `WIDGET-${Date.now()}`,
            created_by: user.id
        }
    });
    console.log(`\n✅ Created Product: ${product.name}`);
    console.log(`👉 product_id: ${product.id}`);

    console.log('\n--- Paste these IDs into your Postman "Create Invoice" request body ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
