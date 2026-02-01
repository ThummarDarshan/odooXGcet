const productService = require('../services/products.service');

class ProductController {
    async create(req, res, next) {
        try {
            const product = await productService.createProduct(req.body, req.user.id);
            res.status(201).json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    async list(req, res, next) {
        try {
            const result = await productService.getProducts(req.query);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    async getOne(req, res, next) {
        try {
            const product = await productService.getProductById(req.params.id);
            res.status(200).json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const product = await productService.updateProduct(req.params.id, req.body);
            res.status(200).json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            await productService.deleteProduct(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async getCategories(req, res, next) {
        try {
            const categories = await productService.getCategories();
            res.status(200).json({ success: true, data: categories });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProductController();
