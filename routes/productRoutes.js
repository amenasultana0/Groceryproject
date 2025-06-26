const express = require('express');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');
const { createNotification } = require('../public/utils/notificationHelper');

const router = express.Router();


router.get('/expiring', authMiddleware, async (req, res) => {
  const now = new Date();
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // midnight today

  const todayEnd = new Date(startOfNow);
  todayEnd.setDate(todayEnd.getDate() + 1); // midnight tomorrow

  const weekEnd = new Date(startOfNow);
  weekEnd.setDate(weekEnd.getDate() + 7); // midnight after 7 days

  const monthEnd = new Date(startOfNow);
  monthEnd.setDate(monthEnd.getDate() + 30); // midnight after 30 days

  console.log('Start of today:', startOfNow);
  console.log('End of today:', todayEnd);
  console.log('End of week:', weekEnd);
  console.log('End of month:', monthEnd);

  try {
    // Fetch products expiring between now and monthEnd
    const products = await Product.find({ 
      userId: req.user._id,
      expiryDate: { $gte: now, $lt: monthEnd }  // products expiring from now until 30 days later
    });

    console.log('Products fetched:', products.map(p => ({ id: p._id, expiryDate: p.expiryDate })));

    const todayItems = products.filter(p => {
      const expiry = new Date(p.expiryDate);
      return expiry >= startOfNow && expiry < todayEnd;
    });

    const weekItems = products.filter(p => {
      const expiry = new Date(p.expiryDate);
      return expiry >= todayEnd && expiry < weekEnd;
    });

    const monthItems = products.filter(p => {
      const expiry = new Date(p.expiryDate);
      return expiry >= weekEnd && expiry < monthEnd;
    });

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


router.post('/add', authMiddleware, async (req, res) => {
  const { name, category, quantity, expiryDate, unitOfMeasurement, costPrice, sellingPrice } = req.body;

  if (!name || quantity == null || !expiryDate) {
    return res.status(400).json({ error: 'Please provide all required fields: name, quantity, expiryDate' });
  }

  if (!isValidDate(expiryDate)) {
    return res.status(400).json({ error: 'Invalid expiryDate format' });
  }

  try {
    const product = new Product({
      name,
      category,
      quantity,
      expiryDate,
      userId: req.user._id,
      unitOfMeasurement,
      costPrice,
      sellingPrice
    });
    await product.save();

    // Emit event after adding product
    const io = req.app.get('io');
    io.emit('productAdded', product);  // Broadcast to all connected clients

    await createNotification(`Product "${product.name}" added`, req.user._id, io);

    res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
    console.error('Add Product Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


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


router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Get Products Error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
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

function getPriority(expiryDate) {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return 'high';
  if (diffDays <= 7) return 'medium';
  return 'low';
}


router.get('/expiring-soon', authMiddleware, async (req, res) => {
  try {
    const priority = req.query.priority || 'all';  // all, high, medium, low
    const expiryFilter = req.query.expiry; // 24h, 1w, 1m

    const today = new Date();
    let query = { userId: req.user._id };

    if (expiryFilter) {
    let expiryEnd = new Date(today);

    // Set expiryEnd based on expiryFilter
    if (expiryFilter === '24h') {
      expiryEnd.setHours(today.getHours() + 24);
    } else if (expiryFilter === '1w') {
      expiryEnd.setDate(today.getDate() + 7);
    } else if (expiryFilter === '1m') {
      expiryEnd.setMonth(today.getMonth() + 1);
    } else {
      expiryEnd.setDate(today.getDate() + 7); // default 1 week
    }

    query.expiryDate = { $gte: today, $lte: expiryEnd };
    }

    const products = await Product.find(query).sort({ expiryDate: 1 });

    // If priority filter is applied, filter here
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

// GET /api/products/search - filter by category and sort
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { category, sortBy, searchText } = req.query;

    const query = { userId: req.user._id };

     // Text search: check name, category, or location
    if (searchText && searchText.trim() !== '') {
      const regex = new RegExp(searchText.trim(), 'i'); // case-insensitive
      query.$or = [
        { name: regex },
        { category: regex },
        { location: regex }
      ];
    }

    if (category && category.trim() !== '') {
      query.category = category;
    }

    // Determine sort field and order
    let sort = {};
    switch (sortBy) {
      case 'expiry':
        sort = { expiryDate: 1 };  // ascending
        break;
      case 'name':
        sort = { name: 1 };
        break;
      case 'category':
        sort = { category: 1 };
        break;
      case 'priority':
        // Priority is not stored, so we calculate it on the fly after fetching
        // We'll sort manually after fetch below
        sort = null;
        break;
      default:
        sort = { createdAt: -1 };
    }

    let products;
    if (sort) {
      products = await Product.find(query).sort(sort);
    } else {
      // If sorting by priority, fetch without sort, then sort manually
      products = await Product.find(query);
      // Sort by priority: high > medium > low
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const getPriority = (expiryDate) => {
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diff = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
        if (diff <= 1) return 'high';
        if (diff <= 7) return 'medium';
        return 'low';
      };

      products.sort((a, b) =>
        priorityOrder[getPriority(a.expiryDate)] - priorityOrder[getPriority(b.expiryDate)]
      );
    }

    res.json(products);
  } catch (error) {
    console.error('Search Products Error:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// GET /api/products/ingredients - get unique ingredient names
router.get('/ingredients', authMiddleware, async (req, res) => {
  try {
    const ingredients = await Product.find({ userId: req.user._id }).select('name -_id');
    const names = [...new Set(ingredients.map(p => p.name))]; // remove duplicates
    res.json(names);
  } catch (error) {
    console.error('Get Ingredient Names Error:', error);
    res.status(500).json({ error: 'Failed to fetch ingredients' });
  }
});

// Example route for low stock products
router.get('/low-stock', authMiddleware, async (req, res) => {
  try {
    const threshold = 30; // Change this limit as needed
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight

    const lowStockItems = await Product.find({
      userId: req.user._id,
      quantity: { $lt: threshold },
      expiryDate: { $gt: today.setHours(23, 59, 59, 999) }  // Only show non-expired items
    });

    res.json(lowStockItems);
  } catch (err) {
    console.error('Error fetching low stock items:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



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
    

    const io = req.app.get('io');
    io.emit('productDeleted', { id: req.params.id });

    await createNotification(`Product "${deleted.name}" deleted`, req.user._id, io);
    
    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;