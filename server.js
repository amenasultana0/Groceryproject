const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const Notification = require('./models/Notification');
const authMiddleware = require('./middleware/authMiddleware');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://127.0.0.1:5500',  // same as your CORS origin
    methods: ['GET', 'POST'],
  }
});

app.set('io', io);

app.use(cors({
  origin: 'http://127.0.0.1:5500', // Your frontend URL
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// API route to fetch notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.get('/api/notifications/unread-count', authMiddleware, async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    userId: req.user.id,
    read: false,
  });
  res.json({ count: unreadCount });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback for frontend routes
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO setup
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send last 10 notifications when a client connects
  Notification.find().sort({ createdAt: -1 }).limit(10)
    .then((notifications) => {
      socket.emit('initialNotifications', notifications);
    });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Mark all notifications as read for logged-in user
app.put('/api/notifications/mark-read', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});


// Helper function to create & broadcast new notifications
async function createNotification(message, userId = null) {
  const notification = new Notification({ message, userId });
  await notification.save();
  io.emit('newNotification', notification);  // broadcast to all connected clients
}

app.set('createNotification', createNotification);

// Example: Simulate a new notification every 30 seconds
setInterval(() => {
  createNotification('You have a new notification!');
}, 30000);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));