const contactService = require('../services/contacts.service');
const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'contacts' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(buffer);
    });
};

class ContactController {
    async create(req, res, next) {
        try {
            if (req.file) {
                const result = await uploadToCloudinary(req.file.buffer);
                req.body.image_url = result.secure_url;
            }
            const contact = await contactService.createContact(req.body, req.user.id);
            res.status(201).json({ success: true, data: contact });
        } catch (error) {
            next(error);
        }
    }

    async list(req, res, next) {
        try {
            const result = await contactService.getContacts(req.query);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    async getOne(req, res, next) {
        try {
            const contact = await contactService.getContactById(req.params.id);
            res.status(200).json({ success: true, data: contact });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            if (req.file) {
                const result = await uploadToCloudinary(req.file.buffer);
                req.body.image_url = result.secure_url;
            }
            const contact = await contactService.updateContact(req.params.id, req.body);
            res.status(200).json({ success: true, data: contact });
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            await contactService.deleteContact(req.params.id);
            res.status(200).json({ success: true, message: 'Contact deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ContactController();
