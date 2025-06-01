const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { verifyUser } = require('../middleware/auth');

// /notifications (show everything, but style unread ones differently)
router.get('/', verifyUser, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    const filter = req.query.filter || 'all';

    const query = { user: userId };
    if (filter === 'unread') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.render('notifications/index', {
      notifications,
      user: req.user,
      filter
    });
  } catch (err) {
    console.error('Notification fetch error:', err);
    res.status(500).send('Error fetching notifications');
  }
});


// Mark one notification as read and delete it
router.post('/read/:id', verifyUser, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { $set: { read: true } }
    );
    res.redirect('/notifications');
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).send('Error marking notification as read');
  }
});

// POST: Mark all notifications as read
router.post('/read-all', verifyUser, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    await Notification.updateMany({ user: userId, read: false }, { $set: { read: true } });

    res.redirect('/notifications'); // 🔄 Redirect back to notification list
  } catch (err) {
    console.error('Error marking all as read:', err);
    res.status(500).send('Failed to mark notifications as read');
  }
});


module.exports = router;
