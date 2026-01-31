const Joi = require('joi');

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().required(),
    role: Joi.string().valid('ADMIN', 'CUSTOMER').required(),
});

const signupSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().min(6).required(),
});

module.exports = {
    loginSchema,
    registerSchema,
    signupSchema,
    changePasswordSchema,
};
