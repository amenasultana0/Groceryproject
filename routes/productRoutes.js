const express = require('express');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');
const { createNotification } = require('../public/utils/notificationHelper');
const Sale = require('../models/Sales');
const DailySales = require('../models/DailySales');
const Category = require('../models/Category');

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
  const { name, category, quantity, expiryDate, unitOfMeasurement, costPrice, barcode } = req.body;
  const isRestock = req.body.isRestock || false;

  if (!name || quantity == null || !expiryDate) {
    return res.status(400).json({ error: 'Please provide all required fields: name, quantity, expiryDate' });
  }

  if (!isValidDate(expiryDate)) {
    return res.status(400).json({ error: 'Invalid expiryDate format' });
  }

  try {
    const productData = {
      name,
      category,
      quantity,
      expiryDate,
      userId: req.user._id,
      unitOfMeasurement,
      costPrice,
      barcode,
      isRestock,
      lastRestockedOn: new Date(), 
    };

    productData.lastRestocked = new Date(); // ✅ Always set it
    if (isRestock) {
      productData.isRestock = true;
    }

    const product = new Product(productData);
    await product.save();

    const io = req.app.get('io');
    io.emit('productAdded', product);

    await createNotification(`Product "${product.name}" added`, req.user._id, io);

    res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
    console.error('Add Product Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/inventory', authMiddleware, async (req, res) => {
  try {
    const allProducts = await Product.find({
      userId: req.user._id,
      quantity: { $gt: 0 }
    })
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort({ expiryDate: 1 }); // oldest batch first

    const grouped = {};
    for (const p of allProducts) {
      if (!grouped[p.name]) {
        grouped[p.name] = p;
      }
    }

    const filteredProducts = Object.values(grouped);
    res.json(filteredProducts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id }).sort({ createdAt: -1 });
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

    const now = new Date();
    let expiryEnd = new Date(now);
    switch (expiryFilter) {
      case '24h':
        expiryEnd.setHours(now.getHours() + 24);
        break;
      case '1w':
        expiryEnd.setDate(now.getDate() + 7);
        break;
      case '1m':
        expiryEnd.setMonth(now.getMonth() + 1);
        break;
      default:
        expiryEnd.setDate(now.getDate() + 30); // Default: 30 days
    }

    // Get all products with quantity > 0 and within expiry range
    const all = await Product.find({
      userId: req.user._id,
      quantity: { $gt: 0 },
      expiryDate: { $gte: now, $lte: expiryEnd }
    }).sort({ expiryDate: 1 });

    // Keep only the latest batch per product name
    const uniqueMap = new Map();
    for (const product of all) {
      const key = product.name.toLowerCase();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, product);
      }
    }

    let filteredProducts = Array.from(uniqueMap.values());

    // Apply priority filter if needed
    if (priority !== 'all') {
      filteredProducts = filteredProducts.filter(p => getPriority(p.expiryDate) === priority);
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

router.get('/low-stock', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch products that are not expired
    const products = await Product.find({
      userId: req.user._id,
      expiryDate: { $gte: today }
    });

    console.log(`Fetched ${products.length} products for user ${req.user._id}`);

    // Fetch categories with threshold info
    const categories = await Category.find({ user: req.user._id });
    const thresholdMap = new Map();
    categories.forEach(cat => {
      thresholdMap.set(cat.name.toLowerCase(), cat.lowStockThreshold ?? 20);
    });

    const lowStockItems = products.filter(prod => {
      const categoryKey = prod.category?.toLowerCase()?.trim() || '';
      const threshold = thresholdMap.get(categoryKey) ?? 20;

      console.log(`Product: ${prod.name}, Qty: ${prod.quantity}, Category: ${prod.category}, Threshold: ${threshold}`);

      return prod.quantity < threshold;
    });

    res.json(lowStockItems);
  } catch (err) {
    console.error('Error fetching low stock items:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/scan-barcode', authMiddleware, async (req, res) => {
  try {
    const { barcode } = req.body;
    const userId = req.user._id;

    if (!barcode) {
      return res.status(400).json({ message: 'Barcode is required' });
    }

    const product = await Product.findOne({ barcode, userId });

    if (!product) {
      return res.status(404).json({ message: 'Product not found for this barcode.' });
    }

    // Reduce quantity by 1
    product.quantity = Math.max(0, product.quantity - 1);
    await product.save();

    res.json({ message: `1 unit of "${product.name}" deducted.`, product });
  } catch (err) {
    console.error('Error in scan-barcode:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// routes/productRoutes.js or wherever you define product APIs
router.get('/stock-levels', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({userId: req.user._id, deleted: { $ne: true } });

    const stockData = {};
    products.forEach(p => {
      const key = p.category || 'Uncategorized';
      stockData[key] = (stockData[key] || 0) + p.quantity;
    });

    const labels = Object.keys(stockData);
    const values = Object.values(stockData);

    res.json({ labels, values });
  } catch (err) {
    console.error('Stock level error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// GET /api/products/restock-due
router.get('/restock-due', authMiddleware, async (req, res) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago

    const products = await Product.find({
      userId: req.user._id,
      lastRestocked: { $lte: cutoffDate },
      deleted: { $ne: true }
    });

    const results = products.map(p => ({
      name: p.name,
      category: p.category,
      lastRestocked: p.lastRestocked
    }));

    res.json(results);
  } catch (err) {
    console.error('Restock due error:', err);
    res.status(500).json({ error: 'Failed to fetch restock data' });
  }
});

// GET /api/products/last-restocked
router.get('/last-restocked', authMiddleware, async (req, res) => {
  try {
    const recentProducts = await Product.find({
      userId: req.user._id,
      isRestock: true
    })
    .sort({ createdAt: -1 })  // latest first
    .limit(10);               // return only 10 latest restocked items

    const processed = recentProducts.map(p => ({
      name: p.name,
      category: p.category,
      lastRestockedOn: p.lastRestockedOn || p.createdAt || null
    }));

    res.json(processed);
  } catch (err) {
    console.error('Error fetching last restocked:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET all expired products
router.get('/expired', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const expiredItems = await Product.find({ userId: req.user._id, expiryDate: { $lt: now } });
    // Filter for unique items
    const unique = [];
    const seen = new Set();
    for (const item of expiredItems) {
      const key = `${item.name}|${item.expiryDate}|${item.category}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }
    res.json(unique); // Only send once
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expired items.' });
  }
});
router.delete('/expired', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const result = await Product.deleteMany({ userId: req.user._id, expiryDate: { $lt: now } });
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expired items.' });
  }
});

router.post('/deduct-by-barcode', authMiddleware, async (req, res) => {
  const { barcodes } = req.body;
  const userId = req.user._id;
  if (!Array.isArray(barcodes) || barcodes.length === 0) {
    return res.status(400).json({ message: 'Barcodes array is required.' });
  }
  let updated = 0, deleted = 0, totalQuantityDeducted = 0;

  for (const barcode of barcodes) {
    const product = await Product.findOne({ barcode, userId });
    if (product) {
      if (product.quantity > 1) {
        product.quantity -= 1;
        await Sale.create({
          productId: product._id,
          userId,
          quantity: 1,
          salePrice: product.costPrice, // assuming you're selling at costPrice for now
          costPrice: product.costPrice,
          customerName: req.body.customerName || 'Walk-in',
          region: req.body.region || 'Unknown'
        });
        await product.save();
        updated++;
        totalQuantityDeducted += 1;
      } else {
          product.quantity = 0; // Mark as out of stock
          await product.save();
          updated++;
          totalQuantityDeducted += 1;
        }
    }
  }

  const today = new Date().toISOString().split("T")[0];
  await DailySales.findOneAndUpdate(
    { date: today, userId },
    { $inc: { sales: totalQuantityDeducted, orders: 1 } },
    { upsert: true, new: true }
  );

  res.json({
    updated,
    deleted,
    totalQuantityDeducted,
    message: `Updated: ${updated}, Deleted: ${deleted}`
  });
});

router.get('/out-of-stock', authMiddleware, async (req, res) => {
  try {
    console.log("req.user:", req.user); // Add this
    if (!req.user || !req.user._id) {
      console.log("Missing user or user ID");
      return res.status(401).json({ error: 'Unauthorized: Missing user ID' });
    }

    const outOfStockItems = await Product.find({
      userId: req.user._id,
      quantity: 0,
      deleted: false
    });

    console.log("Out-of-stock items found:", outOfStockItems.length);
    res.json(outOfStockItems);
  } catch (err) {
    console.error("Error in out-of-stock route:", err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.delete('/out-of-stock/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const io = req.app.get('io');
    io.emit('productDeleted', { id: req.params.id });
    res.json({ message: 'Product permanently deleted' });
  } catch (error) {
    console.error('Out-of-stock delete error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

router.delete('/clear-out-of-stock', authMiddleware, async (req, res) => {
  try {
    const result = await Product.deleteMany({ userId: req.user._id, quantity: 0, deleted: false });
    res.json({ message: 'Cleared out-of-stock items', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Clear out-of-stock error:', error);
    res.status(500).json({ error: 'Failed to delete out-of-stock items' });
  }
});

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

// PUT /api/products/:id - Update product
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, sku, category, quantity, unitOfMeasurement, costPrice, reorderThreshold, supplier, expiryDate } = req.body;

  try {
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, sku, category, quantity, unitOfMeasurement, costPrice, reorderThreshold, supplier, expiryDate },
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