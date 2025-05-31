const express = require('express');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/products/add - Create product
router.post('/add', authMiddleware, async (req, res) => {
  const { name, quantity, expiryDate } = req.body;

  if (!name || !quantity || !expiryDate) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  try {
    const product = new Product({
      name,
      quantity,
      expiryDate,
      userId: req.user._id,
    });
    await product.save();
    res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/products - Get all products for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, quantity, expiryDate } = req.body;

  try {
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, quantity, expiryDate },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    res.json({ message: 'Product updated', product: updatedProduct });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) return res.status(404).json({ error: 'Product not found or unauthorized' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;