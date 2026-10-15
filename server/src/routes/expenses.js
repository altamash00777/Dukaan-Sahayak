const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', expenseController.getAll);
router.post('/', expenseController.create);

module.exports = router;
