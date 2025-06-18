const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET: Basic summary (for legacy/simple use)
router.get('/report', async (req, res) => {
  const today = new Date();
  try {
    const products = await Product.find();

    const expiredItems = [];
    const expiringSoon = [];
    const freshItems = [];
    let totalValue = 0;

    products.forEach(p => {
      const expiry = new Date(p.expiryDate);
      const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      totalValue += (p.price || 0) * (p.quantity || 0);

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
router.post('/report', async (req, res) => {
  const { startDate, endDate, category, status } = req.body;

  try {
    const query = {};

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
      if (status === "Expired" && daysLeft < 0) {
        expired++;
        match = true;
      } else if (status === "Expiring Soon" && daysLeft >= 0 && daysLeft <= 7) {
        expiringSoon++;
        match = true;
      } else if (status === "Fresh" && daysLeft > 7) {
        fresh++;
        match = true;
      } else if (!status || status === 'all') {
        match = true;
        if (daysLeft < 0) expired++;
        else if (daysLeft <= 7) expiringSoon++;
        else fresh++;
      }

      if (match) {
        filteredItems.push(item);
        totalValue += (item.price || 0) * (item.quantity || 0);
      }
    }

    const freshnessIndex = filteredItems.length
      ? Math.round((fresh / filteredItems.length) * 100)
      : 0;

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
      items: filteredItems
    });

  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: 'Error generating filtered report', error: error.message });
  }
});

module.exports = router;