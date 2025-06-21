const express = require('express');
const router = express.Router();
const ShoppingList = require('../models/ShoppingList');
const auth = require('../middleware/authMiddleware'); // adjust if needed

// Get all shopping list items
router.get('/', auth, async (req, res) => {
  const items = await ShoppingList.find({ userId: req.user?._id });
  res.json(items);
});

// Add an item
router.post('/', auth, async (req, res) => {
  const { name, category } = req.body;
  const item = await ShoppingList.create({
    name,
    category,
    userId: req.user?._id
  });
  res.status(201).json(item);
});

// Remove item by ID
router.delete('/:id', auth, async (req, res) => {
  await ShoppingList.deleteOne({ _id: req.params.id, userId: req.user?._id });
  res.json({ success: true });
});

// Clear all
router.delete('/', auth, async (req, res) => {
  await ShoppingList.deleteMany({ userId: req.user?._id });
  res.json({ success: true });
});

module.exports = router;