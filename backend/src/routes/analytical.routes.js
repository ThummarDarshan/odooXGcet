const express = require('express');
const analyticalController = require('../controllers/analytical.controller');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/rules', analyticalController.createRule);
router.get('/rules', analyticalController.getRules);
router.get('/rules/:id', analyticalController.getRule);
router.patch('/rules/:id', analyticalController.updateRule);
router.delete('/rules/:id', analyticalController.deleteRule);

module.exports = router;
