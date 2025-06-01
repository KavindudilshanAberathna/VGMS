const Notification = require('../models/Notification');

const loadNotifications = async (req, res, next) => {
  try {
  if (req.user) {
    const notes = await Notification.find({ user: req.user._id, read: false }).sort({ createdAt: -1 });
    res.locals.notifications = notes;
  } else {
    res.locals.notifications = [];
  }
  next();
} catch (err) {
  console.error('Notification middleware error:', err.message);
  res.locals.notifications = [];
  next();
}
};

module.exports = loadNotifications;
