const express = require('express');
const costCenterController = require('../controllers/costCenters.controller');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', costCenterController.getAll);
router.get('/:id', costCenterController.getOne);
router.post('/', costCenterController.create);
router.patch('/:id', costCenterController.update);
router.delete('/:id', costCenterController.delete);

module.exports = router;
