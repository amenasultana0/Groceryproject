const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('./config/passport');
const Notification = require('./models/Notification');
const Product = require('./models/Product');
const authMiddleware = require('./middleware/authMiddleware');
const notificationsRoute = require('./routes/notifications');
const userRoutes = require('./routes/userRoutes');
const shoppingListRoutes = require('./routes/shoppingList');



app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

const categoryRoutes = require('./routes/categoryRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const reportRoutes = require('./routes/reportRoutes');
const suggestionsRouter = require('./routes/suggestionRoutes');



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
app.use('/api/categories', categoryRoutes);
app.use('/api', settingsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', suggestionsRouter);
app.use('/api/notifications', notificationsRoute);
app.use('/api/auth/users', userRoutes);
app.use('/api/shopping-list', shoppingListRoutes);


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

// --- What's in Season API ---
const fs = require('fs');
const seasonalDataPath = path.join(__dirname, 'data', 'seasonalItems.json');

app.get('/api/produce', (req, res) => {
  const { state, month } = req.query;
  if (!state || !month) {
    return res.status(400).json({ fruits: [], vegetables: [] });
  }

  fs.readFile(seasonalDataPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading seasonalItems.json:', err);
      return res.status(500).json({ fruits: [], vegetables: [] });
    }
    let json;
    try {
      json = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ fruits: [], vegetables: [] });
    }
    const stateData = json[state];
    const monthData = stateData ? stateData[month] : null;
   res.json({
  fruits: monthData && monthData.fruits ? monthData.fruits : [],
  vegetables: monthData && monthData.vegetables ? monthData.vegetables : []
});
  });
});

app.get(/^\/(?!api|auth).*/, (req, res) => {
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


app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const result = await Notification.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Helper function to create & broadcast new notifications
async function createNotification(message, userId = null) {
  const notification = new Notification({ message, userId });
  await notification.save();
  io.emit('newNotification', notification);  // broadcast to all connected clients
}

app.set('createNotification', createNotification);

const cron = require('node-cron');
cron.schedule('0 * * * *', async () => { // every hour
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Expired
 // ...existing code...
// Expired
const expired = await Product.find({ expiryDate: { $lt: now } });
for (const item of expired) {
  const message = `${item.name} has expired!`;
  // Only create if not already notified
  const exists = await Notification.findOne({ message, userId: item.userId });
  if (!exists) {
    const notification = new Notification({ message, userId: item.userId });
    await notification.save();
    io.emit('newNotification', notification);
  }
}

// Expiring within 24 hours
const exp24 = await Product.find({ expiryDate: { $gte: now, $lte: next24h } });
for (const item of exp24) {
  const message = `${item.name} is expiring within 24 hours!`;
  const exists = await Notification.findOne({ message, userId: item.userId });
  if (!exists) {
    const notification = new Notification({ message, userId: item.userId });
    await notification.save();
    io.emit('newNotification', notification);
  }
}

// Expiring soon (within 7 days)
const expSoon = await Product.find({ expiryDate: { $gt: next24h, $lte: soon } });
for (const item of expSoon) {
  const message = `${item.name} is expiring soon (on ${item.expiryDate.toDateString()})!`;
  const exists = await Notification.findOne({ message, userId: item.userId });
  if (!exists) {
    const notification = new Notification({ message, userId: item.userId });
    await notification.save();
    io.emit('newNotification', notification);
  }
}
});

// Example: Simulate a new notification every 30 seconds
// setInterval(() => {
//   createNotification('You have a new notification!');
// }, 30000);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));