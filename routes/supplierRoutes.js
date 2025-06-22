const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET api/suppliers
// @desc    Get all suppliers for a user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const suppliers = await Supplier.find({ userId: req.user.id }).sort({ name: 1 });
        res.json(suppliers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router; 