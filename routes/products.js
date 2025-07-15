const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const auth = require('../middleware/authMiddleware');
const upload = require('../config/cloudinary');

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', auth, upload.single('image'), createProduct);
router.put('/:id', auth, upload.single('image'), updateProduct);
router.delete('/:id', auth, deleteProduct);

module.exports = router;