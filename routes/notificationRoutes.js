const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { verifyUser } = require('../middleware/auth');

// GET notifications for logged-in user
router.get('/', verifyUser, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 }).lean();

    res.render('notifications/index', {
      notifications,
      user: req.user
    });
  } catch (err) {
    console.error('Notification fetch error:', err);
    res.status(500).send('Error fetching notifications');
  }
});

module.exports = router;
