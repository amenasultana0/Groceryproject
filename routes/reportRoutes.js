const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // ✅ Update path if needed

router.get('/report', async (req, res) => {
  const today = new Date();
  const in7Days = new Date(today);
  in7Days.setDate(today.getDate() + 7);

  try {
    const products = await Product.find();

    const expiredItems = [];
    const expiringSoon = [];
    const freshItems = [];

    let totalValue = 0;

    products.forEach(p => {
      const expiry = new Date(p.expiryDate);
      const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

      totalValue += p.price * p.quantity;

      if (daysLeft < 0) expiredItems.push({ ...p._doc, daysLeft });
      else if (daysLeft <= 7) expiringSoon.push({ ...p._doc, daysLeft });
      else freshItems.push({ ...p._doc, daysLeft });
    });

    const freshnessIndex = Math.round((freshItems.length / products.length) * 100);

    res.json({
      expiredItems,
      expiringSoon,
      freshItems,
      totalValue,
      freshnessIndex,
      counts: {
        expired: expiredItems.length,
        expiringSoon: expiringSoon.length,
        fresh: freshItems.length,
      },
      items: [...expiredItems, ...expiringSoon, ...freshItems],
    });

  } catch (err) {
    res.status(500).json({ message: 'Error generating report', error: err });
  }
});

module.exports = router;
