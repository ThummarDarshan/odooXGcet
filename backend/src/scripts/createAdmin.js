const prisma = require('../config/database');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
    // Get credentials from command line args or use defaults
    const email = process.argv[2] || 'admin@shivfurniture.com';
    const password = process.argv[3] || 'Admin@123';
    const name = 'System Admin';

    console.log(`Creating admin user with email: ${email}`);

    try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            console.log(`User with email ${email} already exists.`);
            // Optionally update the role if they exist but aren't admin?
            if (existingUser.role !== 'ADMIN') {
                console.log('Updating role to ADMIN...');
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { role: 'ADMIN' }
                });
                console.log('User role updated to ADMIN.');
            }
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new admin user
        const admin = await prisma.user.create({
            data: {
                name,
                email,
                password_hash: hashedPassword,
                role: 'ADMIN',
                is_active: true
            }
        });

        console.log('Admin user created successfully!');
        console.log('-----------------------------------');
        console.log('Email:', admin.email);
        console.log('Password:', password);
        console.log('-----------------------------------');

    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        await prisma.$disconnect();
    }
};

createAdmin();
