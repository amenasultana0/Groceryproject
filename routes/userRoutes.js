// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.get('/profile', authMiddleware, (req, res) => {
  res.json({
    name: req.user.name,
    email: req.user.email
  });
});

module.exports = router;