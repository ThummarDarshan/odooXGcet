const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

class AuthService {
    async login(email, password) {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.is_active) {
            throw new Error('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Return user data without password
        const { password_hash, ...userData } = user;

        return {
            user: userData,
            token,
        };
    }

    async register(userData) {
        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(userData.password, saltRounds);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: userData.email,
                password_hash,
                name: userData.name,
                role: userData.role,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                created_at: true,
            },
        });

        return user;
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        // Hash new password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: {
                password_hash,
                must_change_password: false
            },
        });

        return { message: 'Password changed successfully' };
    }
}

module.exports = new AuthService();
