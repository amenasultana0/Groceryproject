const express = require('express');
const router = express.Router();
const ShoppingList = require('../models/ShoppingList');
const auth = require('../middleware/authMiddleware');

// Get all shopping list items for the logged-in user
router.get('/', auth, async (req, res) => {
  const items = await ShoppingList.find({ userId: req.user?._id });
  res.json(items);
});

// Add an item
router.post('/', auth, async (req, res) => {
  const { name, category, quantity, price, priority, notes, purchased, availability, emoji, source } = req.body;
  const item = await ShoppingList.create({
    name,
    category,
    quantity,
    price,
    priority,
    notes,
    purchased,
    availability,
    emoji,
    source,
    userId: req.user?._id
  });
  res.status(201).json(item);
});

// Remove item by ID
router.delete('/:id', auth, async (req, res) => {
  await ShoppingList.deleteOne({ _id: req.params.id, userId: req.user?._id });
  res.json({ success: true });
});

// Clear all items for the user
router.delete('/', auth, async (req, res) => {
  await ShoppingList.deleteMany({ userId: req.user?._id });
  res.json({ success: true });
});

// PATCH (update item)
router.patch('/:id', auth, async (req, res) => {
  const updated = await ShoppingList.findOneAndUpdate(
    { _id: req.params.id, userId: req.user?._id },
    req.body,
    { new: true }
  );
  res.json(updated);
});

// GET (get single item)
router.get('/:id', auth, async (req, res) => {
  const item = await ShoppingList.findOne({ _id: req.params.id, userId: req.user?._id });
  res.json(item);
});

// Clear all purchased items for the user
router.delete('/clear-purchased', auth, async (req, res) => {
  await ShoppingList.deleteMany({ userId: req.user?._id, purchased: true });
  res.json({ success: true });
});

module.exports = router;