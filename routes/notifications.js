const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/authMiddleware'); // adjust path as needed

// Get all notifications for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(notifications);
});

// Mark all as read
router.put('/mark-read', authMiddleware, async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } });
  res.json({ success: true });
});

// Get unread count
router.get('/unread-count', authMiddleware, async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user._id, read: false });
  res.json({ count });
});

// Delete all notifications
router.delete('/clear', authMiddleware, async (req, res) => {
  await Notification.deleteMany({ userId: req.user._id });
  res.json({ success: true });
});

// Delete a single notification
router.delete('/:id', authMiddleware, async (req, res) => {
  await Notification.deleteOne({ _id: req.params.id, userId: req.user._id });
  res.json({ success: true });
});

module.exports = router;