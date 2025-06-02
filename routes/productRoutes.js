const express = require('express');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Simple date validation helper
function isValidDate(d) {
  return !isNaN(Date.parse(d));
}

// POST /api/products/add - Create product
router.post('/add', authMiddleware, async (req, res) => {
  const { name, quantity, expiryDate } = req.body;

  if (!name || quantity == null || !expiryDate) {
    return res.status(400).json({ error: 'Please provide all required fields: name, quantity, expiryDate' });
  }

  if (!isValidDate(expiryDate)) {
    return res.status(400).json({ error: 'Invalid expiryDate format' });
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
    console.error('Add Product Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/products - Get all products for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Get Products Error:', error);
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
    console.error('Get Single Product Error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// GET /api/products/expiring-soon - Get products expiring within next 3 days
router.get('/expiring-soon', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);

    const expiringProducts = await Product.find({
      userId: req.user._id,
      expiryDate: { $gte: today, $lte: threeDaysLater },
    }).sort({ expiryDate: 1 });

    res.json(expiringProducts);
  } catch (error) {
    console.error('Get Expiring Products Error:', error);
    res.status(500).json({ error: 'Failed to fetch expiring products' });
  }
});

// PUT /api/products/:id - Update product (partial update supported)
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, quantity, expiryDate } = req.body;

  const updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (quantity !== undefined) updateFields.quantity = quantity;
  if (expiryDate !== undefined) {
    if (!isValidDate(expiryDate)) {
      return res.status(400).json({ error: 'Invalid expiryDate format' });
    }
    updateFields.expiryDate = expiryDate;
  }

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided for update' });
  }

  try {
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    res.json({ message: 'Product updated', product: updatedProduct });
  } catch (error) {
    console.error('Update Product Error:', error);
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
    console.error('Delete Product Error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;