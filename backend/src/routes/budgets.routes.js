const express = require('express');
const budgetController = require('../controllers/budgets.controller');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', budgetController.getAll);
router.get('/:id', budgetController.getOne);
router.post('/', budgetController.create);
router.patch('/:id', budgetController.update);
router.delete('/:id', budgetController.delete);

module.exports = router;
