const express = require('express');
const router = express.Router();
const Category = require('../models/Category'); // Your mongoose model
const authMiddleware = require('../middleware/authMiddleware'); 

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const categories = await Category.find({ user: userId });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


// Add a new category
router.post('/', async (req, res) => {
  try {
    const newCategory = new Category(req.body);
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
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
