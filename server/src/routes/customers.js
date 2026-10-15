const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { verifyToken } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  createCustomerSchema,
  updateCustomerSchema,
} = require('../validators/customerValidators');

router.use(verifyToken);

router.get('/', customerController.getAll);
router.get('/:id', customerController.getById);
router.get('/:id/ledger', customerController.getLedger);
router.post('/', validateRequest(createCustomerSchema), customerController.create);
router.put('/:id', validateRequest(updateCustomerSchema), customerController.update);

module.exports = router;
