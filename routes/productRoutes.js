const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware'); // if using auth

// Create new product
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { name, quantity, expiryDate } = req.body;

    const newProduct = new Product({
      name,
      quantity,
      expiryDate,
      userId: req.user.id,
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
