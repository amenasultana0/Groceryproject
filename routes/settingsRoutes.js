const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// GET /settings - get current user's settings
router.get('/', authMiddleware, (req, res) => {
  res.json(req.user.settings);
});

// PUT /settings - update user settings partially or fully
router.put('/', authMiddleware, async (req, res) => {
  const { notifications, theme, language } = req.body;

  try {
    if (notifications) {
      if (typeof notifications.email === 'boolean') {
        req.user.settings.notifications.email = notifications.email;
      }
      if (typeof notifications.push === 'boolean') {
        req.user.settings.notifications.push = notifications.push;
      }
    }

    if (theme) {
      const allowedThemes = ['light', 'dark'];
      if (allowedThemes.includes(theme)) {
        req.user.settings.theme = theme;
      } else {
        return res.status(400).json({ error: 'Invalid theme value' });
      }
    }

    if (language) {
      // you can add validation for language codes if needed
      req.user.settings.language = language;
    }

    await req.user.save();

    res.json({ message: 'Settings updated successfully', settings: req.user.settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;