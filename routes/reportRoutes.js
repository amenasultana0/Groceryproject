const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const Product = require('../models/Product');
const Sale = require('../models/Sales');

// GET: Basic summary (for legacy/simple use)
router.get('/report', authMiddleware, async (req, res) => {
  const today = new Date();
  try {
    const products = await Product.find({ userId: req.user._id });

    const expiredItems = [];
    const expiringSoon = [];
    const freshItems = [];
    let totalValue = 0;

    products.forEach(p => {
      const expiry = new Date(p.expiryDate);
      const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      totalValue += (p.costPrice || 0) * (p.quantity || 0);

      if (daysLeft < 0) expiredItems.push({ ...p._doc, daysLeft });
      else if (daysLeft <= 7) expiringSoon.push({ ...p._doc, daysLeft });
      else freshItems.push({ ...p._doc, daysLeft });
    });

    const freshnessIndex = products.length ? Math.round((freshItems.length / products.length) * 100) : 0;

    res.json({
      expiredItems,
      expiringSoon,
      freshItems,
      totalValue,
      freshnessIndex,
      counts: {
        expired: expiredItems.length,
        expiringSoon: expiringSoon.length,
        fresh: freshItems.length,
      },
      items: [...expiredItems, ...expiringSoon, ...freshItems],
    });

  } catch (err) {
    res.status(500).json({ message: 'Error generating report', error: err.message });
  }
});

// POST: Advanced filtered report with expiry summary
router.post('/report', authMiddleware, async (req, res) => {
  const { startDate, endDate, category, status } = req.body;
  const normalizedStatus = status ? status.toLowerCase().replace(/\s/g, '') : null;

  try {
    const query = { userId: req.user._id };
// ...date and category filtering...

    // Date filtering
    if (startDate || endDate) {
      query.expiryDate = {};
      if (startDate) query.expiryDate.$gte = new Date(startDate);
      if (endDate) query.expiryDate.$lte = new Date(endDate);
    }

    // Category filtering
    if (category && category !== 'all') {
      query.category = category;
    }

    // Fetch items from DB
    const products = await Product.find(query).lean();

    // Status-based filtering and metrics
    const today = new Date();
    const filteredItems = [];
    let expired = 0, expiringSoon = 0, fresh = 0, totalValue = 0;

    for (let p of products) {
      const expiryDate = new Date(p.expiryDate);
      const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      const item = { ...p, daysLeft };

      let match = false;
      if (normalizedStatus === "Expired" && daysLeft < 0) {
        expired++;
        match = true;
      } else if (normalizedStatus === "Expiring Soon" && daysLeft >= 0 && daysLeft <= 7) {
        expiringSoon++;
        match = true;
      } else if (normalizedStatus === "Fresh" && daysLeft > 7) {
        fresh++;
        match = true;
      } else if (!normalizedStatus || normalizedStatus === 'all') {
          match = true;
          if (daysLeft < 0) expired++;
          else if (daysLeft <= 7) expiringSoon++;
          else fresh++;
        }


      if (match) {
        filteredItems.push(item);
        totalValue += (item.costPrice || 0) * (item.quantity || 0);
      }
    }

    const freshnessIndex = filteredItems.length
      ? Math.round((fresh / filteredItems.length) * 100)
      : 0;

    // --- Add this for value-based actions (immediate + short-term)
    const now = new Date();
    const in7Days = new Date(now);
    in7Days.setDate(now.getDate() + 7);

    let immediateItems = [];
    let shortTermItems = [];

    filteredItems.forEach(item => {
      const expiry = new Date(item.expiryDate);
      if (expiry < now) {
        immediateItems.push(item);
      } else if (expiry >= now && expiry <= in7Days) {
        shortTermItems.push(item);
      }
    });

    const calcValue = (arr) =>
      arr.reduce((sum, item) => sum + ((item.costPrice || 0) * (item.quantity || 0)), 0);

    const actions = {
      immediate: {
        totalValue: calcValue(immediateItems),
        items: immediateItems,
      },
      shortTerm: {
        totalValue: calcValue(shortTermItems),
        items: shortTermItems,
      }
    };


    // Expiry summary for insights
    const expiry = {
      critical: filteredItems.filter(item => item.daysLeft <= 2).length,
      warning: filteredItems.filter(item => item.daysLeft > 2 && item.daysLeft <= 5).length,
      attention: filteredItems.filter(item => item.daysLeft > 5 && item.daysLeft <= 7).length,
      safe: filteredItems.filter(item => item.daysLeft > 7).length
    };

    res.json({
      metrics: {
        expired,
        expiringSoon,
        fresh,
        totalValue,
        freshnessIndex,
        expiry
      },
      items: filteredItems,
      actions
    });

  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: 'Error generating filtered report', error: error.message });
  }
});

router.get('/sales-trend', authMiddleware, async (req, res) => {
  try {
    const { period } = req.query;
    const match = { userId: req.user._id };

    let groupByFormat;
    switch (period) {
      case 'daily': groupByFormat = '%Y-%m-%d'; break;
      case 'weekly': groupByFormat = '%Y-%U'; break;
      case 'monthly': groupByFormat = '%Y-%m'; break;
      case 'yearly': groupByFormat = '%Y'; break;
      default: groupByFormat = '%Y-%m-%d'; break;
    }

    const trend = await Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: "$saleDate" } },
          totalSales: { $sum: "$salePrice" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      labels: trend.map(item => item._id),
      values: trend.map(item => item.totalSales)
    });
  } catch (err) {
    console.error('Error in sales-trend route:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/sales-by-category', authMiddleware, async (req, res) => {
  try {
    const sales = await Sale.aggregate([
      { $match: { userId: req.user._id } },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          total: { $sum: '$salePrice' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      labels: sales.map(item => item._id || 'Uncategorized'),
      values: sales.map(item => item.total)
    });
  } catch (err) {
    console.error('Error in sales-by-category:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/top-products', authMiddleware, async (req, res) => {
  try {
    const sales = await Sale.aggregate([
      { $match: { userId: req.user._id } },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.name',
          unitsSold: { $sum: '$quantity' }
        }
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 7 }
    ]);

    res.json({
      labels: sales.map(item => item._id || 'Unnamed Product'),
      values: sales.map(item => item.unitsSold)
    });
  } catch (err) {
    console.error('Error in top-products route:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/region-performance', authMiddleware, async (req, res) => {
  try {
    const sales = await Sale.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$region',
          total: { $sum: '$salePrice' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      labels: sales.map(item => item._id || 'Unknown'),
      values: sales.map(item => item.total)
    });
  } catch (err) {
    console.error('Error in region-performance route:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stock-turnover', authMiddleware, async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user._id }).populate('productId');

    const turnover = {};

    sales.forEach(sale => {
      if (!sale.productId) return; // skip if product was deleted

      const name = sale.productId.name;
      turnover[name] = (turnover[name] || 0) + sale.quantity;
    });

    const labels = Object.keys(turnover);
    const values = Object.values(turnover);

    res.json({ labels, values });
  } catch (err) {
    console.error('Turnover error:', err);
    res.status(500).json({ error: 'Failed to fetch turnover' });
  }
});

router.get('/stock-cost-summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const products = await Product.find({ userId, deleted: { $ne: true } });

    let totalInventoryCost = 0;
    let restockingCost = 0;
    let categoryCostMap = {};
    let totalQuantity = 0;

    products.forEach(p => {
      const cost = p.costPrice * p.quantity;
      const createdAt = new Date(p.createdAt);
      const restockedOn = new Date(p.lastRestocked);
      
      const isNew = createdAt >= start && createdAt <= end;
      const isRestock = !isNew && restockedOn >= start && restockedOn <= end;

      if (isNew) {
        totalInventoryCost += cost;
      } else if (isRestock) {
        restockingCost += cost;
      }

      if (!categoryCostMap[p.category]) {
        categoryCostMap[p.category] = 0;
      }
      categoryCostMap[p.category] += cost;

      totalQuantity += p.quantity;
    });

    const sales = await Sale.find({
      userId,
      createdAt: { $gte: start, $lte: end }
    });

    let soldQuantity = 0;
    let consumedCost = 0;

    sales.forEach(s => {
      soldQuantity += s.quantity;
      consumedCost += s.costPrice * s.quantity;
    });

    const stockMovementRatio = totalQuantity > 0 ? ((soldQuantity / totalQuantity) * 100).toFixed(2) : '0.00';

    res.json({
      totalInventoryCost: parseFloat(totalInventoryCost.toFixed(2)),
      restockingCost: parseFloat(restockingCost.toFixed(2)),
      consumedCost: parseFloat(consumedCost.toFixed(2)),
      stockMovementRatio,
      categoryCostBreakdown: categoryCostMap
    });

  } catch (err) {
    console.error('Error in /stock-cost-summary:', err);
    res.status(500).json({ message: 'Failed to calculate cost summary' });
  }
});

router.get('/customer-demographics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const demographics = await Sale.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const labels = demographics.map(d => d._id || 'Unknown');
    const values = demographics.map(d => d.count);

    res.json({ labels, values });
  } catch (err) {
    console.error("Demographics error:", err);
    res.status(500).json({ error: 'Failed to fetch customer demographics' });
  }
});

router.get('/top-customers', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const topCustomers = await Sale.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$customerName',
          totalSpent: { $sum: { $multiply: ['$quantity', '$salePrice'] } }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    const labels = topCustomers.map(c => c._id || 'Unknown');
    const values = topCustomers.map(c => c.totalSpent);

    res.json({ labels, values });
  } catch (err) {
    console.error("Top customers error:", err);
    res.status(500).json({ error: 'Failed to fetch top customers' });
  }
});

router.get('/customer-metrics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const customers = await Sale.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$customerName',
          totalSpent: { $sum: { $multiply: ['$quantity', '$salePrice'] } },
          purchaseCount: { $sum: 1 }
        }
      }
    ]);

    const total = customers.length;
    const newCustomers = customers.filter(c => c.purchaseCount === 1).length;
    const repeat = customers.filter(c => c.purchaseCount > 1).length;
    const ltv = customers.reduce((acc, c) => acc + c.totalSpent, 0) / (total || 1);

    res.json({
      total,
      new: newCustomers,
      repeat,
      ltv
    });
  } catch (err) {
    console.error("Customer metrics error:", err);
    res.status(500).json({ error: 'Failed to fetch customer metrics' });
  }
});

router.get('/wastage/by-category', authMiddleware, async (req, res) => {
  try {
    const expiredProducts = await Product.find({
      userId: req.user._id,
      expiryDate: { $lte: new Date(new Date().setHours(23, 59, 59, 999)) },
    });

    const breakdown = {};
    expiredProducts.forEach(prod => {
      breakdown[prod.category] = (breakdown[prod.category] || 0) + (prod.quantity * prod.costPrice);
    });

    res.json({
      labels: Object.keys(breakdown),
      values: Object.values(breakdown)
    });
  } catch (err) {
    console.error('Error fetching wastage by category:', err);
    res.status(500).json({ message: 'Failed to fetch data' });
  }
});

router.get('/wastage/value', authMiddleware, async (req, res) => {
  try {
      const expired = await Product.find({
      userId: req.user._id,
      expiryDate: { $lte: new Date(new Date().setHours(23, 59, 59, 999)) },
    });

    const totalLoss = expired.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0);
    res.json({ totalLoss });
  } catch (err) {
    console.error('Error calculating loss value:', err);
    res.status(500).json({ message: 'Failed to fetch total loss' });
  }
});

router.get('/wastage/alerts', authMiddleware, async (req, res) => {
  try {
    const expired = await Product.find({
      userId: req.user._id,
      expiryDate: { $lte: new Date(new Date().setHours(23, 59, 59, 999)) },
    });

    const topLost = expired
      .map(p => ({
        name: p.name,
        category: p.category,
        value: p.costPrice * p.quantity
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    res.json(topLost);
  } catch (err) {
    console.error('Error fetching wastage alerts:', err);
    res.status(500).json({ message: 'Failed to fetch alerts' });
  }
});

module.exports = router;