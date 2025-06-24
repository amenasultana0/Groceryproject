// routes/mfaRoutes.js
const express = require('express');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
//const jwt = require('jsonwebtoken');

const router = express.Router();

// Generate QR code for MFA setup
router.post('/generate', authMiddleware, (req, res) => {
  const secret = speakeasy.generateSecret({ name: 'GroceryExpiryTracker' });

  qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
    if (err) return res.status(500).send('QR generation failed');

    res.json({ qrCode: data_url, secret: secret.base32 }); // Frontend will save temp secret
  });
});


router.post('/verify-mfa-login', async (req, res) => {
  const { userId, token } = req.body;
  const user = await User.findById(userId);
  if (!user || !user.mfaSecret) {
    return res.status(400).json({ error: 'MFA not set up' });
  }

  const isVerified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!isVerified) {
    return res.status(400).json({ error: 'Invalid MFA token' });
  }

  // Now login is successful → issue token
  const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  res.json({ success: true, token: authToken, user });
});


// Verify MFA token and save to DB
router.post('/setup', authMiddleware, async (req, res) => {
  const { token, secret } = req.body;

  const isVerified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1
  });

  if (!isVerified) return res.status(400).json({ success: false, message: 'Invalid MFA token' });

  try {
    await User.findByIdAndUpdate(req.user.id, { mfaSecret: secret });
    res.json({ success: true, message: 'MFA enabled' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to enable MFA' });
  }
});

module.exports = router;