
const express = require('express');
const router = express.Router();

const invoiceController = require('../controllers/invoiceController');
const { verifyToken } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const {
  createDraftSchema,
  confirmInvoiceSchema,
} = require('../validators/invoiceValidators');

router.use(verifyToken);

router.get('/', invoiceController.getAll);

router.post(
  '/draft',
  validateRequest(createDraftSchema),
  invoiceController.createDraft
);

router.get('/:id/pdf', invoiceController.getPDF);

router.post(
  '/:id/confirm',
  validateRequest(confirmInvoiceSchema),
  invoiceController.confirmInvoice
);

router.delete('/:id', invoiceController.deleteInvoice);

router.get('/:id', invoiceController.getById);

module.exports = router;
