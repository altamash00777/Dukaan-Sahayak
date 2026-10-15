const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', inventoryController.getInventory);
router.get('/alerts', inventoryController.getAlerts);
router.get('/summary', inventoryController.getSummary);

module.exports = router;
