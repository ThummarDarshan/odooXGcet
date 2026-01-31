const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔄 Syncing Users with Contacts...\n');

        // Get all CUSTOMER users
        const customerUsers = await prisma.user.findMany({
            where: { role: 'CUSTOMER' }
        });

        console.log(`Found ${customerUsers.length} customer users\n`);

        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!admin) {
            console.log('❌ No admin user found!');
            return;
        }

        for (const user of customerUsers) {
            // Check if contact already exists for this user
            const existingContact = await prisma.contact.findFirst({
                where: {
                    OR: [
                        { email: user.email },
                        { user_id: user.id }
                    ]
                }
            });

            if (existingContact) {
                console.log(`✓ Contact already exists for ${user.email}`);

                // Update the contact to link to the user if not already linked
                if (!existingContact.user_id) {
                    await prisma.contact.update({
                        where: { id: existingContact.id },
                        data: { user_id: user.id }
                    });
                    console.log(`  → Linked contact to user account`);
                }
            } else {
                // Create a new contact for this user
                const contact = await prisma.contact.create({
                    data: {
                        type: 'CUSTOMER',
                        name: user.name,
                        email: user.email,
                        phone: '+91 00000 00000', // Default phone
                        address: 'Not provided',
                        is_active: true,
                        user_id: user.id,
                        created_by: admin.id
                    }
                });

                console.log(`✅ Created contact for ${user.email}`);
                console.log(`   Contact ID: ${contact.id}`);
            }
        }

        // Show final count
        const contactCount = await prisma.contact.count();
        console.log(`\n📊 Total contacts in database: ${contactCount}`);

        // List all contacts
        const contacts = await prisma.contact.findMany({
            include: { user: true },
            orderBy: { created_at: 'desc' }
        });

        console.log('\n📇 All Contacts:');
        contacts.forEach(c => {
            const portalStatus = c.user_id ? '✓ Portal Access' : '✗ No Portal';
            console.log(`   - ${c.name} (${c.email}) - ${c.type} - ${portalStatus}`);
            console.log(`     ID: ${c.id}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
