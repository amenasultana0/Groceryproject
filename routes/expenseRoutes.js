const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const authMiddleware = require('../middleware/authMiddleware');

// ➕ POST: Add new expense
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { category, amount, supplier, dueDate, paid} = req.body;
    const expense = new Expense({
      userId: req.user._id,
      category,
      amount,
      date,
      supplier,
      dueDate,
      notes
    });
    await expense.save();
    res.json({ message: 'Expense recorded successfully' });
  } catch (err) {
    console.error('Error adding expense:', err);
    res.status(500).json({ message: 'Failed to record expense' });
  }
});

// 📊 GET: Expense breakdown by category
router.get('/breakdown', authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id });
    const breakdown = {};

    expenses.forEach(exp => {
      breakdown[exp.category] = (breakdown[exp.category] || 0) + exp.amount;
    });

    res.json({
      labels: Object.keys(breakdown),
      values: Object.values(breakdown)
    });
  } catch (err) {
    console.error('Error fetching breakdown:', err);
    res.status(500).json({ message: 'Failed to fetch expense breakdown' });
  }
});

// 🏦 GET: Supplier payment totals
router.get('/suppliers', authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id, supplier: { $ne: null } });
    const supplierTotals = {};

    expenses.forEach(exp => {
      supplierTotals[exp.supplier] = (supplierTotals[exp.supplier] || 0) + exp.amount;
    });

    res.json({
      labels: Object.keys(supplierTotals),
      values: Object.values(supplierTotals)
    });
  } catch (err) {
    console.error('Error fetching supplier payments:', err);
    res.status(500).json({ message: 'Failed to fetch supplier payments' });
  }
});

// ⏳ GET: Upcoming payments
router.get('/upcoming', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    const upcoming = await Expense.find({
      userId: req.user._id,
      dueDate: { $gte: today }
    }).sort('dueDate');

    res.json(upcoming);
  } catch (err) {
    console.error('Error fetching upcoming payments:', err);
    res.status(500).json({ message: 'Failed to fetch upcoming payments' });
  }
});

module.exports = router;