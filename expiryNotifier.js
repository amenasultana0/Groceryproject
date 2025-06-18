const cron = require('node-cron');
const Product = require('../models/Product');
const Notification = require('../models/Notification');

module.exports = function(io) {
  cron.schedule('0 * * * *', async () => { // every hour
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Expired
    const expired = await Product.find({ expiryDate: { $lt: now } });
    for (const item of expired) {
      const message = `${item.name} has expired!`;
      const exists = await Notification.findOne({
        productId: item._id,
        userId: item.userId,
        type: 'expired'
      });
    if (!exists) {
      const notification = new Notification({ message, userId: item.userId, productId: item._id, type: 'expired'});
      await notification.save();
      io.emit('newNotification', notification);
    }
}

   // Expiring within 24 hours
const exp24 = await Product.find({ expiryDate: { $gte: now, $lte: next24h } });
for (const item of exp24) {
  const exists = await Notification.findOne({
    productId: item._id,
    userId: item.userId,
    type: 'expiring24h'
  });
  if (!exists) {
    const message = `${item.name} is expiring soon (on ${item.expiryDate.toDateString()})!`;
    const notification = new Notification({ message, userId: item.userId, productId: item._id, type: 'expiring24h' });
    await notification.save();
    io.emit('newNotification', notification);
  }
}

// Expiring soon (within 7 days)
const expSoon = await Product.find({ expiryDate: { $gt: next24h, $lte: soon } });
for (const item of expSoon) {
  const exists = await Notification.findOne({
    productId: item._id,
    userId: item.userId,
    type: 'expiringSoon'
  });
  if (!exists) {
    const message = `${item.name} is expiring soon (on ${item.expiryDate.toDateString()})!`;
    const notification = new Notification({ message, userId: item.userId, productId: item._id, type: 'expiringSoon'});
    await notification.save();
    io.emit('newNotification', notification);
  }
}
  });
};