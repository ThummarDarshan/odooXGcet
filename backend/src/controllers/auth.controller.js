const authService = require('../services/auth.service');

class AuthController {
    async login(req, res, next) {
        try {
            const result = await authService.login(req.body.email, req.body.password);
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error.message === 'Invalid credentials') {
                return res.status(401).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }

    async register(req, res, next) {
        try {
            const user = await authService.register(req.body);
            res.status(201).json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    async signup(req, res, next) {
        try {
            // Force role to CUSTOMER for public signup
            const userData = {
                ...req.body,
                role: 'CUSTOMER'
            };

            const user = await authService.register(userData);
            res.status(201).json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req, res, next) {
        try {
            await authService.changePassword(
                req.user.id,
                req.body.current_password,
                req.body.new_password
            );
            res.status(200).json({
                success: true,
                message: 'Password changed successfully',
            });
        } catch (error) {
            if (error.message === 'Current password is incorrect') {
                return res.status(401).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }
}

module.exports = new AuthController();
