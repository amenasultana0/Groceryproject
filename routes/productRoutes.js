const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/authMiddleware');

// All routes protected by auth
router.get('/', auth, async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

router.post('/', auth, async (req, res) => {
  const { name, expiryDate, quantity } = req.body;
  const newProduct = new Product({ name, expiryDate, quantity });
  await newProduct.save();
  res.status(201).json(newProduct);
});

router.delete('/:id', auth, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Product deleted' });
});

router.put('/:id', auth, async (req, res) => {
  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

module.exports = router;
