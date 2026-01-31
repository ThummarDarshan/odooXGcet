const Joi = require('joi');

const createContact = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().allow('', null),
    phone: Joi.string().required(),
    address: Joi.string().allow('', null),
    street: Joi.string().allow('', null),
    city: Joi.string().allow('', null),
    state: Joi.string().allow('', null),
    country: Joi.string().allow('', null),
    pincode: Joi.string().allow('', null),
    type: Joi.string().valid('customer', 'vendor').required(),
    portalAccess: Joi.boolean(),
    password: Joi.string().allow('', null),
    portalPassword: Joi.string().allow('', null), // Frontend sends this
    status: Joi.string().valid('draft', 'confirmed', 'archived', 'active').allow('', null),
    image: Joi.string().allow('', null),
    imageUrl: Joi.string().allow('', null),
    tags: Joi.array().items(Joi.string()).allow(null),
    tagName: Joi.string().allow('', null),
    tax_id: Joi.string().allow('', null),
    image_url: Joi.string().allow('', null) // allow both conventions
});

const updateContact = Joi.object({
    name: Joi.string(),
    email: Joi.string().email().allow('', null),
    phone: Joi.string(),
    address: Joi.string().allow('', null),
    street: Joi.string().allow('', null),
    city: Joi.string().allow('', null),
    state: Joi.string().allow('', null),
    country: Joi.string().allow('', null),
    pincode: Joi.string().allow('', null),
    type: Joi.string().valid('customer', 'vendor'),
    portalAccess: Joi.boolean(),
    password: Joi.string().allow('', null),
    portalPassword: Joi.string().allow('', null), // Frontend sends this
    status: Joi.string().valid('draft', 'confirmed', 'archived', 'active').allow('', null),
    image: Joi.string().allow('', null),
    imageUrl: Joi.string().allow('', null),
    tags: Joi.array().items(Joi.string()).allow(null),
    tagName: Joi.string().allow('', null),
    tax_id: Joi.string().allow('', null),
    image_url: Joi.string().allow('', null)
});

module.exports = {
    createContact,
    updateContact
};
