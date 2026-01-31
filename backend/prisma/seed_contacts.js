const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Find the admin user to use as creator
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!admin) {
            console.log('❌ No admin user found. Please run: node prisma/seed.js first');
            return;
        }

        console.log(`✅ Found admin user: ${admin.email}`);

        // Create a test customer contact
        const contact = await prisma.contact.create({
            data: {
                type: 'CUSTOMER',
                name: 'Test Customer',
                email: 'testcustomer@example.com',
                phone: '+91 98765 43210',
                address: '123 Test Street, Test City',
                is_active: true,
                created_by: admin.id
            }
        });

        console.log('\n✅ Created test contact:');
        console.log(`   ID: ${contact.id}`);
        console.log(`   Name: ${contact.name}`);
        console.log(`   Email: ${contact.email}`);
        console.log(`   Type: ${contact.type}`);

        // Create a test vendor contact
        const vendor = await prisma.contact.create({
            data: {
                type: 'VENDOR',
                name: 'Test Vendor',
                email: 'testvendor@example.com',
                phone: '+91 87654 32109',
                address: '456 Vendor Avenue, Vendor City',
                is_active: true,
                created_by: admin.id
            }
        });

        console.log('\n✅ Created test vendor:');
        console.log(`   ID: ${vendor.id}`);
        console.log(`   Name: ${vendor.name}`);
        console.log(`   Email: ${vendor.email}`);
        console.log(`   Type: ${vendor.type}`);

        console.log('\n🎉 Test data created successfully!');
        console.log('You can now view these contacts in the frontend.');

    } catch (error) {
        console.error('❌ Error creating test data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
