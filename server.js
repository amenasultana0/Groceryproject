/*const express = require('express');
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

// API routes
app.use('/api/authRoutes', authRoutes);
app.use('/api/productRoutes', groceryRoutes);

// Default root API message (optional)
app.get('/', (req, res) => {
  res.send('Grocery Expiry Tracker API');
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'Frontend')));

// For SPA routing: serve index.html for any other requests not handled by above routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'Frontend', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});*/

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const groceryRoutes = require('./routes/productRoutes');

dotenv.config();

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// API routes
app.use('/api/authRoutes', authRoutes);
app.use('/api/productRoutes', groceryRoutes);

// ✅ Serve static frontend files
const frontendPath = path.join(__dirname, 'Frontend');
app.use(express.static(frontendPath));

// ✅ Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



