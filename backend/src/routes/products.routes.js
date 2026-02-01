const express = require('express');
const productController = require('../controllers/products.controller');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware);

const validate = require('../middlewares/validate');
const { createProduct, updateProduct } = require('../validators/product.validator');

router.post('/', validate(createProduct), productController.create);
router.get('/', productController.list);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getOne);
router.patch('/:id', validate(updateProduct), productController.update);
router.delete('/:id', productController.delete);

module.exports = router;
