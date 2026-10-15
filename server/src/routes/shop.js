const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/profile', shopController.getProfile);
router.put('/profile', shopController.updateProfile);

module.exports = router;
