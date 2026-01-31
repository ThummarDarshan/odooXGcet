const express = require('express');
const contactController = require('../controllers/contacts.controller');
const authMiddleware = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createContact, updateContact } = require('../validators/contact.validator');

const router = express.Router();

router.use(authMiddleware);

const upload = require('../middlewares/upload');

router.post('/', upload.single('image'), validate(createContact), contactController.create);
router.get('/', contactController.list);
router.get('/:id', contactController.getOne);
router.put('/:id', upload.single('image'), validate(updateContact), contactController.update);
router.patch('/:id', upload.single('image'), validate(updateContact), contactController.update);
router.delete('/:id', contactController.delete);

module.exports = router;
