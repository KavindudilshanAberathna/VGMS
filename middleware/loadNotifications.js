const Notification = require('../models/Notification');

const loadNotifications = async (req, res, next) => {
  if (req.user) {
    const notes = await Notification.find({ user: req.user._id, read: false }).sort({ createdAt: -1 });
    res.locals.notifications = notes;
  } else {
    res.locals.notifications = [];
  }
  next();
};

module.exports = loadNotifications;
