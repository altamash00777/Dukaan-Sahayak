const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/chat', assistantController.sendMessage);
router.get('/history', assistantController.getHistory);

module.exports = router;
