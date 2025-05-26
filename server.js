const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Backend API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// --- Frontend Integration ---
app.use(express.static(path.join(__dirname, 'Frontend')));

// For Single Page Apps (or direct URL access)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'Frontend', 'index.html'));
});

