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
    const { name, icon, lowStockThreshold } = req.body;

    // Check if category already exists for this user (case-insensitive)
    const existingCategory = await Category.findOne({
      user: req.user.id,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const newCategory = new Category({
      name,
      icon,
      user: req.user.id,
      lowStockThreshold: parseInt(lowStockThreshold, 10),
      items: []
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
    console.error('Error adding category:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Delete a category by id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Optional: Also delete associated products if needed
        // await Product.deleteMany({ category: category.name });

        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting category' });
    }
});

module.exports = router;
