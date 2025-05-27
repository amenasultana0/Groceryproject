const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const groceryRoutes = require('./routes/productRoutes');

dotenv.config();

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// 1. API routes first
app.use('/api/authRoutes', authRoutes);
app.use('/api/productRoutes', groceryRoutes);

// 2. Serve frontend static files
app.use(express.static(path.join(__dirname, 'Frontend')));

// 3. Catch-all only for non-API routes (SPA fallback)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'Frontend', 'index.html'));
});

// Optional: error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});




