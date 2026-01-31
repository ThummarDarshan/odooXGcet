const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('📊 Checking database contents...\n');

        // Count users
        const userCount = await prisma.user.count();
        console.log(`👥 Users: ${userCount}`);

        if (userCount > 0) {
            const users = await prisma.user.findMany({
                select: { id: true, email: true, role: true, name: true }
            });
            users.forEach(u => {
                console.log(`   - ${u.email} (${u.role}) - ID: ${u.id}`);
            });
        }

        // Count contacts
        const contactCount = await prisma.contact.count();
        console.log(`\n📇 Contacts: ${contactCount}`);

        if (contactCount > 0) {
            const contacts = await prisma.contact.findMany({
                select: { id: true, name: true, email: true, type: true, user_id: true },
                take: 10
            });
            contacts.forEach(c => {
                const portalStatus = c.user_id ? '✓ Has Portal' : '✗ No Portal';
                console.log(`   - ${c.name} (${c.type}) ${portalStatus} - ID: ${c.id}`);
            });
        } else {
            console.log('   ⚠️  No contacts found in database!');
            console.log('   💡 Run: node prisma/seed_contacts.js to create test data');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
