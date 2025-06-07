// utils/notificationHelper.js
const Notification = require('../../models/Notification');

async function createNotification(message, userId = null, io) {
  const notification = new Notification({ message, userId });
  await notification.save();

  if(io){
    io.emit('newNotification', notification);
}
  return notification;
}

module.exports = { createNotification };