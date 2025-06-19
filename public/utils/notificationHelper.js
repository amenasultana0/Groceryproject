// utils/notificationHelper.js
const Notification = require('../../models/Notification');

async function createNotification(message, userId, io, productId = null, type = null) {
  if (productId && type) {
    const exists = await Notification.findOne({ userId, productId, type });
    if (exists) return;
  }
  
  const notification = new Notification({ message, userId });
  await notification.save();

  if(io){
    io.emit('newNotification', notification);
}
}

module.exports = { createNotification };