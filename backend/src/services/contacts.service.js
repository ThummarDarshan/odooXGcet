const emailService = require('./email.service');
const bcrypt = require('bcryptjs'); // Assuming bcryptjs is used
const prisma = require('../config/database');

class ContactService {
    async createContact(data, userId) {
        if (data.type) data.type = data.type.toUpperCase();

        return await prisma.$transaction(async (tx) => {
            // Check if email exists if provided
            if (data.email) {
                const existing = await tx.contact.findFirst({
                    where: { email: data.email }
                });
                if (existing) {
                    throw new Error('Contact with this email already exists');
                }
            }

            // Security: Only CUSTOMER can have portal access
            if (data.type === 'VENDOR' && data.portalAccess) {
                // Silently disable portal access
                data.portalAccess = false;
            }

            let newUserId = undefined;
            if (data.portalAccess && data.email && data.type === 'CUSTOMER') {
                // Check if user exists
                const existingUser = await tx.user.findUnique({ where: { email: data.email } });
                if (existingUser) throw new Error('User account already exists with this email');

                // Generate temp password
                const tempPassword = Math.random().toString(36).slice(-8);
                const finalPassword = data.portalPassword || data.password || tempPassword;

                const hashedPassword = await bcrypt.hash(finalPassword, 10);

                const newUser = await tx.user.create({
                    data: {
                        email: data.email,
                        name: data.name,
                        password_hash: hashedPassword,
                        role: 'CUSTOMER',
                        is_active: true,
                        must_change_password: true // Force reset
                    }
                });
                newUserId = newUser.id;

                // Send Email asynchronously
                emailService.sendPortalAccessEmail(data.email, finalPassword, data.name).catch(err => {
                    console.error('Failed to send portal access email:', err);
                });
            }

            // Handle Tag
            let tagId = undefined;
            if (data.tagName) {
                const tag = await tx.tag.upsert({
                    where: { name: data.tagName },
                    update: {},
                    create: { name: data.tagName }
                });
                tagId = tag.id;
            }

            const sanitize = (input) => {
                const { name, email, phone, address, street, city, state, country, pincode, type, is_active, tax_id, image_url, image, status } = input;
                const result = { name, email, phone, type, tax_id };

                // Store address components separately
                if (street !== undefined) result.street = street;
                if (city !== undefined) result.city = city;
                if (state !== undefined) result.state = state;
                if (country !== undefined) result.country = country;
                if (pincode !== undefined) result.pincode = pincode;

                // Also store combined address for backward compatibility
                if (street || city || state || country || pincode) {
                    const addressParts = [street, city, state, country, pincode].filter(part => part && part.trim() !== '');
                    result.address = addressParts.join(', ');
                } else if (address) {
                    result.address = address;
                }

                // Handle image field (frontend might send 'image' or 'image_url')
                if (image_url) result.image_url = image_url;
                else if (image) result.image_url = image;

                // Handle status
                if (status) {
                    // Normalize status to match Enum (DRAFT, CONFIRMED, ARCHIVED)
                    const statusUpper = status.toUpperCase();
                    if (['DRAFT', 'CONFIRMED', 'ARCHIVED'].includes(statusUpper)) {
                        result.status = statusUpper;
                        // DRAFT is also active (visible in system), only ARCHIVED is inactive
                        result.is_active = statusUpper !== 'ARCHIVED';
                    }
                } else if (is_active !== undefined) {
                    result.is_active = is_active;
                    // If manually setting is_active=true but no status, default to ACTIVE? 
                    // Or keep default DRAFT from schema? Let's leave status undefined to use default DRAFT if new.
                }

                return result;
            };

            const contactData = {
                ...sanitize(data),
                created_by: userId
            };

            if (newUserId) {
                contactData.user_id = newUserId;
            }
            if (tagId) {
                contactData.tag_id = tagId;
            }

            const contact = await tx.contact.create({
                data: contactData,
                include: { user: true, tag: true }
            });
            return contact;
        });
    }

    async updateContact(id, data) {
        if (data.type) data.type = data.type.toUpperCase();

        return await prisma.$transaction(async (tx) => {
            // Get existing contact
            const existingContact = await tx.contact.findUnique({
                where: { id },
                include: { user: true }
            });

            if (!existingContact) {
                throw new Error('Contact not found');
            }

            // Handle Portal Access Logic
            let newUserId = existingContact.user_id;

            // Check if portal access is being enabled for the first time
            if (data.portalAccess && !existingContact.user_id && existingContact.type === 'CUSTOMER') {
                const email = data.email || existingContact.email;
                const name = data.name || existingContact.name;

                if (!email) {
                    throw new Error('Email is required to enable portal access');
                }

                // Check if user exists
                const existingUser = await tx.user.findUnique({ where: { email } });
                if (existingUser) {
                    throw new Error('User account already exists with this email');
                }

                // Generate password (use provided or generate random)
                const tempPassword = Math.random().toString(36).slice(-8);
                const finalPassword = data.portalPassword || data.password || tempPassword;

                const hashedPassword = await bcrypt.hash(finalPassword, 10);

                const newUser = await tx.user.create({
                    data: {
                        email: email,
                        name: name,
                        password_hash: hashedPassword,
                        role: 'CUSTOMER',
                        is_active: true,
                        must_change_password: true
                    }
                });
                newUserId = newUser.id;

                // Send Email asynchronously
                emailService.sendPortalAccessEmail(email, finalPassword, name).catch(err => {
                    console.error('Failed to send portal access email:', err);
                });
            }

            // Security: Only CUSTOMER can have portal access
            if (data.type === 'VENDOR' && data.portalAccess) {
                data.portalAccess = false;
            }

            let tagId = undefined;
            if (data.tagName) {
                const tag = await tx.tag.upsert({
                    where: { name: data.tagName },
                    update: {},
                    create: { name: data.tagName }
                });
                tagId = tag.id;
            }

            const sanitize = (input) => {
                const { name, email, phone, address, street, city, state, country, pincode, type, is_active, tax_id, image_url, image, status } = input;
                // Filter out undefined values
                const filtered = {};
                if (name !== undefined) filtered.name = name;
                if (email !== undefined) filtered.email = email;
                if (phone !== undefined) filtered.phone = phone;

                // Store address components separately
                if (street !== undefined) filtered.street = street;
                if (city !== undefined) filtered.city = city;
                if (state !== undefined) filtered.state = state;
                if (country !== undefined) filtered.country = country;
                if (pincode !== undefined) filtered.pincode = pincode;

                // Also store combined address for backward compatibility
                if (street !== undefined || city !== undefined || state !== undefined || country !== undefined || pincode !== undefined) {
                    const addressParts = [street, city, state, country, pincode].filter(part => part && part.trim() !== '');
                    filtered.address = addressParts.join(', ');
                } else if (address !== undefined) {
                    filtered.address = address;
                }

                if (type !== undefined) filtered.type = type;
                if (tax_id !== undefined) filtered.tax_id = tax_id;

                // Handle image field (frontend might send 'image' or 'image_url')
                if (image_url !== undefined) filtered.image_url = image_url;
                else if (image !== undefined) filtered.image_url = image;

                // Handle status
                if (status) {
                    // Normalize status to match Enum (DRAFT, CONFIRMED, ARCHIVED)
                    const statusUpper = status.toUpperCase();
                    if (['DRAFT', 'CONFIRMED', 'ARCHIVED'].includes(statusUpper)) {
                        filtered.status = statusUpper;
                        filtered.is_active = statusUpper !== 'ARCHIVED';
                    }
                } else if (is_active !== undefined) {
                    filtered.is_active = is_active;
                }

                return filtered;
            };

            const updateData = sanitize(data);
            if (tagId) updateData.tag_id = tagId;
            if (newUserId && newUserId !== existingContact.user_id) {
                updateData.user_id = newUserId;
            }

            return await tx.contact.update({
                where: { id },
                data: updateData,
                include: { tag: true, user: true }
            });
        });
    }

    async getContacts(filters = {}) {
        const { type, search, status, page = 1, limit = 20 } = filters;
        const where = {};

        // Filter by Status if provided, otherwise default logic
        if (status) {
            const statusUpper = status.toUpperCase();
            if (statusUpper === 'ALL') {
                // Fetch all
            } else if (['DRAFT', 'CONFIRMED', 'ARCHIVED'].includes(statusUpper)) {
                where.status = statusUpper;
            } else {
                // Fallback for legacy status values if any
                if (status === 'active' || status === 'confirmed') where.status = 'CONFIRMED';
                else if (status === 'archived') where.status = 'ARCHIVED';
            }
        } else {
            // Default: Show CONFIRMED and DRAFT (hide ARCHIVED)
            where.status = { in: ['CONFIRMED', 'DRAFT'] };
        }

        if (type) where.type = type.toUpperCase();
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { tag: { name: { contains: search, mode: 'insensitive' } } } // Search by tag too
            ];
        }

        const [contacts, total] = await Promise.all([
            prisma.contact.findMany({
                where,
                include: {
                    tag: true,
                    user: true  // Include linked user for portal access
                },
                skip: (page - 1) * limit,
                take: Number(limit),
                orderBy: { created_at: 'desc' }
            }),
            prisma.contact.count({ where })
        ]);

        return {
            data: contacts.map(c => ({
                ...c,
                status: c.status ? c.status.toLowerCase() : 'draft' // Normalize to lowercase for frontend
            })),
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getContactById(id) {
        const contact = await prisma.contact.findUnique({
            where: { id },
            include: {
                tag: true,
                user: true  // Include linked user for portal access
            }
        });
        if (!contact) throw new Error('Contact not found');
        return {
            ...contact,
            status: contact.status ? contact.status.toLowerCase() : 'draft'
        };
    }

    async deleteContact(id) {
        // Soft delete
        return await prisma.contact.update({
            where: { id },
            data: {
                is_active: false,
                status: 'ARCHIVED'
            }
        });
    }
}

module.exports = new ContactService();
