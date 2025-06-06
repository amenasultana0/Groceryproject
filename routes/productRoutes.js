/*const express = require('express');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/expiring', authMiddleware, async (req, res) => {
  const today = new Date();
  const oneWeekFromNow = new Date(today);
  oneWeekFromNow.setDate(today.getDate() + 7);
  const oneMonthFromNow = new Date(today);
  oneMonthFromNow.setMonth(today.getMonth() + 1);

  try {
    const products = await Product.find({ userId: req.user.id });
    const todayItems = products.filter(p => isSameDay(new Date(p.expiryDate), today));
    const weekItems = products.filter(p => new Date(p.expiryDate) > today && new Date(p.expiryDate) <= oneWeekFromNow);
    const monthItems = products.filter(p => new Date(p.expiryDate) > oneWeekFromNow && new Date(p.expiryDate) <= oneMonthFromNow);

    res.json({
      today: todayItems,
      week: weekItems,
      month: monthItems,
      all: products
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

function isSameDay(d1, d2) {
  return d1.getDate() === d2.getDate() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getFullYear() === d2.getFullYear();
}

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
*/
const express = require('express');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Helper Functions
function isSameDay(d1, d2) {
  return d1.getDate() === d2.getDate() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getFullYear() === d2.getFullYear();
}

function isValidDate(d) {
  return !isNaN(Date.parse(d));
}

function getPriority(expiryDate) {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return 'high';
  if (diffDays <= 7) return 'medium';
  return 'low';
}

// GET /api/products/expiring
router.get('/expiring', authMiddleware, async (req, res) => {
  const today = new Date();
  const oneWeekFromNow = new Date(today);
  oneWeekFromNow.setDate(today.getDate() + 7);
  const oneMonthFromNow = new Date(today);
  oneMonthFromNow.setMonth(today.getMonth() + 1);

  try {
    const products = await Product.find({ userId: req.user._id });
    const todayItems = products.filter(p => isSameDay(new Date(p.expiryDate), today));
    const weekItems = products.filter(p => new Date(p.expiryDate) > today && new Date(p.expiryDate) <= oneWeekFromNow);
    const monthItems = products.filter(p => new Date(p.expiryDate) > oneWeekFromNow && new Date(p.expiryDate) <= oneMonthFromNow);

    res.json({
      today: todayItems,
      week: weekItems,
      month: monthItems,
      all: products
    });
  } catch (error) {
    console.error('Get Expiring Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/products/expiring-soon
router.get('/expiring-soon', authMiddleware, async (req, res) => {
  try {
    const priority = req.query.priority || 'all';
    const expiryFilter = req.query.expiry;
    const today = new Date();
    let query = { userId: req.user._id };

    if (expiryFilter) {
      let expiryEnd = new Date(today);
      if (expiryFilter === '24h') {
        expiryEnd.setHours(today.getHours() + 24);
      } else if (expiryFilter === '1w') {
        expiryEnd.setDate(today.getDate() + 7);
      } else if (expiryFilter === '1m') {
        expiryEnd.setMonth(today.getMonth() + 1);
      } else {
        expiryEnd.setDate(today.getDate() + 3);
      }
      query.expiryDate = { $gte: today, $lte: expiryEnd };
    } else {
      const threeDaysLater = new Date();
      threeDaysLater.setDate(today.getDate() + 3);
      query.expiryDate = { $gte: today, $lte: threeDaysLater };
    }

    const products = await Product.find(query).sort({ expiryDate: 1 });
    let filteredProducts = products;
    if (priority !== 'all') {
      filteredProducts = products.filter(p => getPriority(p.expiryDate) === priority);
    }

    res.json({ items: filteredProducts });
  } catch (error) {
    console.error('Get Expiring Products Error:', error);
    res.status(500).json({ error: 'Failed to fetch expiring products' });
  }
});

// POST /api/products/add
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

// GET /api/products
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Get Products Error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
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

// PUT /api/products/:id
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

// DELETE /api/products/:id
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
