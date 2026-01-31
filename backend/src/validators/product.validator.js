const Joi = require('joi');

const createProduct = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow('', null),
    sku: Joi.string().allow('', null),
    category: Joi.string().required(),
    sellPrice: Joi.number().min(0).required(),
    purchasePrice: Joi.number().min(0).allow(null),
    price: Joi.number().min(0), // Fallback
    image_url: Joi.string().allow('', null), // frontend might send snake_case or camelCase? Check form.
    // Form sends image_url? No, form sends camelCase usually but ProductForm sends basic data. 
    // Wait, ProductForm.tsx sends sellPrice, purchasePrice. 
    // image_url is not in the form yet? Schema in backend has image_url.
    // Let's allow snake_case or camelCase for image.
    imageUrl: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'archived').default('active'),
    is_active: Joi.boolean().default(true)
}).options({ stripUnknown: true });

const updateProduct = Joi.object({
    name: Joi.string(),
    description: Joi.string().allow('', null),
    sku: Joi.string().allow('', null),
    category: Joi.string(),
    sellPrice: Joi.number().min(0),
    purchasePrice: Joi.number().min(0).allow(null),
    price: Joi.number().min(0),
    imageUrl: Joi.string().allow('', null),
    image_url: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'archived'),
    is_active: Joi.boolean()
});

module.exports = {
    createProduct,
    updateProduct
};
