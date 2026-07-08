const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.post('/', contactController.createContactMessage);
router.get('/', authMiddleware, adminOnly, contactController.getContactMessages);

module.exports = router;
