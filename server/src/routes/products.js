const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  createProductSchema,
  updateProductSchema,
} = require('../validators/productValidators');

router.use(verifyToken);

router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.post('/', validateRequest(createProductSchema), productController.create);
router.put('/:id', validateRequest(updateProductSchema), productController.update);
router.delete('/:id', productController.delete);

module.exports = router;
