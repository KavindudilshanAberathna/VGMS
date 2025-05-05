const express = require('express');
const router = express.Router();
const { verifyUser, requireRole, isAuthenticated } = require('../middleware/auth');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const withDefaultProfile = require('../utils/withDefaultProfile');
const Appointment = require('../models/Appointment');


// Dashboard route
router.get('/', verifyUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) return res.redirect('/login');

    const dashboardViews = {
      admin: 'dashboard/admin',
      mechanic: 'dashboard/mechanic',
      customer: 'dashboard/customer'
    };

    // ✅ Check if customer, fetch appointments
    if (user.role === 'customer') {
      const appointments = await Appointment.find({ user: user._id }).lean();
      return res.render('dashboard/customer', { user});
    }

    // Otherwise for admin or mechanic
    res.render(dashboardViews[user.role], { user });
    
  } catch (err) {
    console.error(err);
    res.redirect('/login');
  }
});

// Multer config for profile image updates
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });
  
  router.get('/profile', verifyUser, async (req, res) => {
    const user = await User.findById(req.user.userId).lean();
    res.render('dashboard/profile', { user, success: null, error: null });
  });
  
  router.post('/profile', verifyUser, upload.single('profileImage'), async (req, res) => {
    try {
      const { fullName } = req.body;
  
      const update = { fullName };
      if (req.file) {
        update.profileImage = req.file.filename;
      }
  
      await User.findByIdAndUpdate(req.user.userId, update);
  
      const user = await User.findById(req.user.userId).lean();
      res.render('dashboard/profile', { user, success: 'Profile updated successfully', error: null });
    } catch (err) {
      console.error(err);
      const user = await User.findById(req.user.userId).lean();
      res.render('dashboard/profile', { user, success: 'Something went wrong' });
    }
  });

// POST: Change Password
router.post('/profile/change-password', verifyUser, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
  
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.render('dashboard/profile', {
        user: user.toObject(),
        success: null,
        error: 'Current password is incorrect.'
      });
    }
  
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();
  
    res.render('dashboard/profile', {
      user: user.toObject(),
      success: 'Password updated successfully!',
      error: null
    });
  });
  
  // POST: Delete Account
  router.post('/profile/delete', verifyUser, async (req, res) => {
    await User.findByIdAndDelete(req.user.userId);
    res.clearCookie('token');
    res.redirect('/register');
  });
  
  module.exports = router;
