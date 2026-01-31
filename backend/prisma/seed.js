const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@gmail.com';
    const password = 'Admin@123'; // Default password
    const name = 'System Admin';

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        console.log(`User with email ${email} already exists.`);
        return;
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
        data: {
            email,
            password_hash,
            name,
            role: 'ADMIN',
            is_active: true,
        },
    });

    console.log(`Created admin user: ${user.email} with password: ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
