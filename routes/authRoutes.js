// const express = require('express');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const router = express.Router();

 

// // POST /api/auth/login
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ error: 'Invalid credentials' });

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: '1d',
//     });

//     res.json({ message: 'Login successful', token });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// module.exports = router;

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');

const router = express.Router();

function validateEmail(email) {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}

function validatePassword(password) {
  return password && password.length >= 6;
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, please try again later.' },
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password || !validateEmail(email) || !validatePassword(password)) {
    return res.status(400).json({ error: 'Invalid email or password (min 6 characters).' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Just create user with plain password, hashing is automatic
    const user = new User({ email, password });
    await user.save();

    res.status(201).json({ message: 'User registered successfully', user: { id: user._id, email: user.email } });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/register
 router.post('/register', async (req, res) => {
   const { email, password } = req.body;

   try {
     const exists = await User.findOne({ email });
     if (exists) {
       return res.status(400).json({ error: 'User already exists' });
     }

     const user = new User({ email, password });
     await user.save();

     res.status(201).json({ message: 'User registered successfully' });
   } catch (error) {
     res.status(500).json({ error: 'Server error' });
   }
 });

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ message: 'Login successful', token, user: { id: user._id, email: user.email } });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
