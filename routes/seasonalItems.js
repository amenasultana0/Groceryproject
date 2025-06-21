const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/seasonal-items?month=June&region=South-West
router.get('/', async (req, res) => {
  const { month, region } = req.query;
  const items = await Product.find({
    monthAvailable: month,
    regionTags: region
  });
  res.json(items);
});

module.exports = router;