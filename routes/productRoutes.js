const express = require('express');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

function startOfDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
}

function endOfDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

// router.get('/expiring', authMiddleware, async (req, res) => {
//   try {
//     const today = new Date();
//     const todayStart = startOfDay(today);

//     // Calculate date ranges for today, next 7 days, next 1 month
//     const todayEnd = new Date(todayStart);
//     todayEnd.setDate(todayEnd.getDate() + 1); // tomorrow start

//     const weekEnd = new Date(todayStart);
//     weekEnd.setDate(weekEnd.getDate() + 7);
//     const weekEndEnd = endOfDay(weekEnd);

//     const monthEnd = new Date(weekEnd);
//     monthEnd.setMonth(monthEnd.getMonth() + 1);
//     const monthEndEnd = endOfDay(monthEnd);

//     // Query MongoDB for products expiring today
//     const todayItems = await Product.find({
//       userId: req.user._id,
//       expiryDate: { $gte: todayStart, $lt: todayEnd }
//     });

//     // Products expiring in the next 7 days (excluding today)
//     const weekItems = await Product.find({
//       userId: req.user._id,
//       expiryDate: { $gte: weekStart, $lt: weekEndEnd }
//     });

//     // Products expiring in the next 1 month (excluding the next 7 days)
//     const monthItems = await Product.find({
//       userId: req.user._id,
//       expiryDate: { $gte: monthStart, $lt: monthEndEnd }
//     });

//     // All products for the user
//     const allProducts = await Product.find({ userId: req.user._id });

//     res.json({
//       today: todayItems,
//       week: weekItems,
//       month: monthItems,
//       all: allProducts
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

router.get('/expiring', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const now = new Date();

    // Today range
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

    // Week range: tomorrow to next 7 days
    const weekStart = new Date(todayEnd);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

    // Month range: after 7 days to next 1 month
    const monthStart = new Date(weekEnd);
    const monthEnd = new Date(monthStart);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

    // Queries
    const todayItems = await Product.find({
      userId,
      expiryDate: { $gte: todayStart, $lt: todayEnd },
    });

    const weekItems = await Product.find({
      userId,
      expiryDate: { $gte: weekStart, $lt: weekEnd },
    });

    const monthItems = await Product.find({
      userId,
      expiryDate: { $gte: monthStart, $lt: monthEnd },
    });

    const allProducts = await Product.find({ userId });

    res.json({
      today: todayItems,
      week: weekItems,
      month: monthItems,
      all: allProducts,
    });
  } catch (error) {
    console.error('Expiring route error:', error);
    res.status(500).json({ error: 'Server error' });
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
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0); // Start of today in UTC

    const threeDaysLater = new Date(now);
    threeDaysLater.setUTCDate(threeDaysLater.getUTCDate() + 3); // 3 days ahead

    const expiringProducts = await Product.find({
      userId: req.user._id,
      expiryDate: { $gte: now, $lt: threeDaysLater },
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