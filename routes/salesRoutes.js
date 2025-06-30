const DailySales = require('../models/DailySales');
const Product = require('../models/Product');
const Sale = require('../models/Sales');

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

let totalSales = 0;
let totalOrders = 0;

router.post('/sale', authMiddleware, async (req, res) => {
  try {
    const { quantity = 1, customerName = 'Walk-in', region = 'Unknown' } = req.body;
    const today = new Date().toISOString().split("T")[0];

    await DailySales.findOneAndUpdate(
      { date: today, userId: req.user._id },
      { $inc: { sales: quantity } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Sale.create({
      userId: req.user._id,
      quantity,
      salePrice: 0, // or actual value if you have it
      costPrice: 0, // or actual value
      customerName: customerName.trim(),
      region: region.trim()
    });

    res.json({ message: 'Sale recorded' });
  } catch (err) {
    console.error('Error logging sale:', err);
    res.status(500).json({ message: 'Error recording sale' });
  }
});

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const stats = await DailySales.findOne({ date: today, userId: req.user._id });

    const lowStockItems = await Product.find({
      userId: req.user._id,
      quantity: { $lt: 30 },
      expiryDate: { $gt: new Date() } // not expired
    });

    const lowStockCount = lowStockItems.length;

    res.json({
      sales: stats?.sales ?? 0,
      orders: stats?.orders ?? 0,
      lowStockCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

router.post('/sales/order', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    await DailySales.findOneAndUpdate(
      { date: today, userId: req.user._id },
      { $inc: { orders: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: "Order logged" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/profit', authMiddleware, async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user._id });

    let totalRevenue = 0;
    let totalCost = 0;

    for (const sale of sales) {
      totalRevenue += (sale.salePrice || 0) * sale.quantity;
      totalCost += (sale.costPrice || 0) * sale.quantity;
    }

    const profit = totalRevenue - totalCost;

    res.json({ totalRevenue, totalCost, profit });
  } catch (err) {
    console.error('Error calculating profit:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;