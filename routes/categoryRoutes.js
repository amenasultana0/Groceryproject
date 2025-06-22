const express = require('express');
const router = express.Router();
const Category = require('../models/Category'); // Your mongoose model
const authMiddleware = require('../middleware/authMiddleware'); 

// @route   GET api/categories
// @desc    Get all categories for a user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const categories = await Category.find({ user: req.user.id }).sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Add a new category
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, icon } = req.body;

    const newCategory = new Category({
      name,
      icon,
      user: req.user.id,
      items: []
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Delete a category by id
router.delete('/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid category id' });
  }
});

module.exports = router;
