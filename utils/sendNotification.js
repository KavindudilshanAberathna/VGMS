const Notification = require('../models/Notification');

const sendNotification = async (userId, message, link = '/') => {
  try {
    await Notification.create({ user: userId, message, link });
    console.log(`✅ Notification created for user: ${userId}`);
  } catch (err) {
    console.error('❌ Notification creation failed:', err.message);
  }
};

module.exports = sendNotification;
