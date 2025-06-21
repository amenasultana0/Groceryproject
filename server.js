const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const Notification = require('./models/Notification');
const Product = require('./models/Product');
const authMiddleware = require('./middleware/authMiddleware');
const notificationsRoute = require('./routes/notifications');
const User = require('./models/User');
const Category = require('./models/Category');
const Supplier = require('./models/Supplier');

dotenv.config();

const app = express();
const path = require('path');
const cors = require('cors');
require('./config/passport')(passport);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
}));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

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

// Seed database with initial data
const seedDatabase = async () => {
  try {
    // Check if any user exists
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found. Seeding database...');

      // 1. Create a default user
      const defaultUser = new User({
        googleId: 'default-user',
        displayName: 'Default User',
        email: 'user@example.com',
        image: ''
      });
      await defaultUser.save();
      console.log('Default user created.');

      // 2. Create sample categories
      const categories = [
        { name: 'Produce', icon: 'fas fa-carrot', color: '#f5b041', user: defaultUser._id },
        { name: 'Dairy', icon: 'fas fa-cheese', color: '#5dade2', user: defaultUser._id },
        { name: 'Bakery', icon: 'fas fa-bread-slice', color: '#d39e7c', user: defaultUser._id },
      ];
      const createdCategories = await Category.insertMany(categories);
      console.log(`${createdCategories.length} categories created.`);

      // 3. Create sample suppliers
      const suppliers = [
        { name: 'Fresh Farms Inc.', contactPerson: 'John Farmer', userId: defaultUser._id },
        { name: 'DairyBest', contactPerson: 'Mary Milk', userId: defaultUser._id },
        { name: 'Happy Baker Co.', contactPerson: 'Tom Crust', userId: defaultUser._id },
      ];
      const createdSuppliers = await Supplier.insertMany(suppliers);
      console.log(`${createdSuppliers.length} suppliers created.`);

      // 4. Create sample products
      const products = [
        { name: 'Organic Apples', sku: 'PROD-001', category: createdCategories[0]._id, quantity: 50, unitOfMeasurement: 'kg', costPrice: 1.5, sellingPrice: 2.5, reorderThreshold: 10, supplier: createdSuppliers[0]._id, expiryDate: new Date('2024-12-31'), userId: defaultUser._id },
        { name: 'Whole Milk', sku: 'DAIRY-001', category: createdCategories[1]._id, quantity: 5, unitOfMeasurement: 'gallons', costPrice: 2, sellingPrice: 3.5, reorderThreshold: 12, supplier: createdSuppliers[1]._id, expiryDate: new Date('2024-08-15'), userId: defaultUser._id },
        { name: 'Sourdough Bread', sku: 'BAKE-001', category: createdCategories[2]._id, quantity: 30, unitOfMeasurement: 'loaves', costPrice: 3, sellingPrice: 5, reorderThreshold: 10, supplier: createdSuppliers[2]._id, expiryDate: new Date('2024-08-10'), userId: defaultUser._id },
      ];
      await Product.insertMany(products);
      console.log(`${products.length} products created.`);
      console.log('Database seeding complete.');
    } else {
      console.log('Database already contains data. Skipping seeding.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Seed the database after connecting
mongoose.connection.on('connected', () => {
  seedDatabase();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api', settingsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', suggestionsRouter);
app.use('/api/notifications', notificationsRoute);
app.use('/api/suppliers', require('./routes/supplierRoutes'));

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