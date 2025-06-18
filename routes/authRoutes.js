const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');
const passport = require('passport');

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

    if (!user.password) {
      return res.status(400).json({ error: 'This account was created using Google login. Please log in with Google.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
  message: 'Login successful',
  token,
  user: { 
    id: user._id, 
    email: user.email,
    name: user.name  // ✅ Add this line
  }
});
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://127.0.0.1:5500/public/index.html', session: false }),
  (req, res) => {
    const user = req.user;

    if (!user || !user._id) {
      console.error('User not found or ID is missing');
      return res.redirect('/login'); // or show error
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });


    // Redirect to dashboard with token and user info in URL (or set cookie, or serve it in a view)
    const userInfo = {
      id: user._id,
      name: user.name,
      email: user.email
    };

    const encodedUser = encodeURIComponent(JSON.stringify(userInfo));
    res.redirect(`http://127.0.0.1:5500/public/dashboard.html?token=${token}&user=${encodedUser}`);
  }
);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: 'http://127.0.0.1:5500/public/login.html', session: false }),
  (req, res) => {
    const user = req.user;
    if (!user || !user._id) {
      return res.redirect('http://127.0.0.1:5500/public/login.html');
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const userInfo = {
      id: user._id,
      name: user.name,
      email: user.email
    };

    const encodedUser = encodeURIComponent(JSON.stringify(userInfo));
    res.redirect(`http://127.0.0.1:5500/public/dashboard.html?token=${token}&user=${encodedUser}`);
  }
);

module.exports = router;