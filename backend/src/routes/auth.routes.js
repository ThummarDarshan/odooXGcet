const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { loginSchema, registerSchema, signupSchema, changePasswordSchema } = require('../validators/auth.validator');
const authMiddleware = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);

router.post('/signup', validate(signupSchema), authController.signup);

// Only ADMIN can register new users directly (internal users)
router.post(
    '/register',
    authMiddleware,
    roleCheck(['ADMIN']),
    validate(registerSchema),
    authController.register
);

router.post(
    '/change-password',
    authMiddleware,
    validate(changePasswordSchema),
    authController.changePassword
);

router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
