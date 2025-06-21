const express = require('express');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');
const { createNotification } = require('../public/utils/notificationHelper');

const router = express.Router();

// @route   GET api/products/inventory
// @desc    Get all inventory products for a user
// @access  Private
router.get('/inventory', authMiddleware, async (req, res) => {
    try {
        const products = await Product.find({ userId: req.user.id })
            .populate('category', 'name')
            .populate('supplier', 'name')
            .sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/products
// @desc    Create a new product
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    const {
        name, sku, category, quantity, unitOfMeasurement,
        costPrice, sellingPrice, reorderThreshold, supplier, expiryDate
    } = req.body;

    try {
        const newProduct = new Product({
            name, sku, category, quantity, unitOfMeasurement,
            costPrice, sellingPrice, reorderThreshold, supplier, expiryDate,
            userId: req.user.id
        });

        const product = await newProduct.save();
        const populatedProduct = await Product.findById(product._id)
            .populate('category', 'name')
            .populate('supplier', 'name');

        res.status(201).json(populatedProduct);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).send('Server Error');
    }
});


// @route   GET api/products (this can be for general-purpose fetching if needed)
// @desc    Get all products for a user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Get Products Error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user.id });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('Get Single Product Error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});


// PUT /api/products/:id - Update product
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, sku, category, quantity, unitOfMeasurement, costPrice, sellingPrice, reorderThreshold, supplier, expiryDate } = req.body;

  try {
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { name, sku, category, quantity, unitOfMeasurement, costPrice, sellingPrice, reorderThreshold, supplier, expiryDate },
      { new: true, runValidators: true }
    ).populate('category', 'name').populate('supplier', 'name');

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'Product not found or unauthorized' });
    
    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;