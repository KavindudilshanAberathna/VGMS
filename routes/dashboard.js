const express = require('express');
const router = express.Router();
const { verifyUser, requireRole, isAuthenticated } = require('../middleware/auth');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const withDefaultProfile = require('../utils/withDefaultProfile');
const Appointment = require('../models/Appointment');
const loadNotifications = require('../middleware/loadNotifications');
const Transaction = require('../models/Transaction');
const BookedPart = require('../models/BookedPart');

router.get('/', verifyUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) return res.redirect('/login');

    const dashboardViews = {
      admin: 'dashboard/admin',
      mechanic: 'dashboard/mechanic',
      customer: 'dashboard/customer'
    };

    if (user.role === 'customer') {
      const appointments = await Appointment.find({ customer: user._id }).lean();
      return res.render('dashboard/customer', { user });
    }

    if (user.role === 'admin') {
      const totalUsers = await User.countDocuments();
      const totalCustomers = await User.countDocuments({ role: 'customer' });
      const totalMechanics = await User.countDocuments({ role: 'mechanic' });
      const totalAppointments = await Appointment.countDocuments();
      const completedAppointments = await Appointment.countDocuments({ status: 'Completed' });
      const transactions = await Transaction.find({ status: 'Paid' }).lean();
      const revenue = transactions.reduce((total, txn) => total + (txn.amount || 0), 0);

      // Utility: Get start and end of a given week (Sunday - Saturday)
function getWeekRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.setDate(now.getDate() - now.getDay() + offset * 7));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

const { start: thisWeekStart, end: thisWeekEnd } = getWeekRange(0);     // Current week
const { start: lastWeekStart, end: lastWeekEnd } = getWeekRange(-1);   // Previous week

// Revenue this week
const thisWeekTxns = await Transaction.find({
  status: 'Paid',
  paidAt: { $gte: thisWeekStart, $lte: thisWeekEnd }
}).lean();
const thisWeekRevenue = thisWeekTxns.reduce((sum, tx) => sum + (tx.amount || 0), 0);

// Revenue last week
const lastWeekTxns = await Transaction.find({
  status: 'Paid',
  paidAt: { $gte: lastWeekStart, $lte: lastWeekEnd }
}).lean();
const lastWeekRevenue = lastWeekTxns.reduce((sum, tx) => sum + (tx.amount || 0), 0);

// Calculate percentage change
let revenueChangePercent = 0;
if (lastWeekRevenue > 0) {
  revenueChangePercent = (((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100).toFixed(2);
} else if (thisWeekRevenue > 0) {
  revenueChangePercent = 100; // assume full increase if nothing last week
}


      const stats = {
        totalUsers,
        totalCustomers,
        totalMechanics,
        totalAppointments,
        completedAppointments,
        revenue
      };

// New customers this week
const newCustomersThisWeek = await User.countDocuments({
  role: 'customer',
  createdAt: { $gte: thisWeekStart, $lte: thisWeekEnd }
});

// New customers last week
const newCustomersLastWeek = await User.countDocuments({
  role: 'customer',
  createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd }
});

let newCustomerGrowth = 0;
if (newCustomersLastWeek > 0) {
  newCustomerGrowth = (((newCustomersThisWeek - newCustomersLastWeek) / newCustomersLastWeek) * 100).toFixed(2);
} else if (newCustomersThisWeek > 0) {
  newCustomerGrowth = 100;
}

// Count appointments booked this week
const appointmentsThisWeek = await Appointment.countDocuments({
  createdAt: { $gte: thisWeekStart, $lte: thisWeekEnd }
});

// Count appointments booked last week
const appointmentsLastWeek = await Appointment.countDocuments({
  createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd }
});

// Calculate booking percentage change
let appointmentBookingGrowth = 0;
if (appointmentsLastWeek > 0) {
  appointmentBookingGrowth = (((appointmentsThisWeek - appointmentsLastWeek) / appointmentsLastWeek) * 100).toFixed(2);
} else if (appointmentsThisWeek > 0) {
  appointmentBookingGrowth = 100;
}


      return res.render(dashboardViews[user.role]
        , { user,
          stats :
        {
          totalUsers,
          totalCustomers,
          totalMechanics,
          totalAppointments,
          completedAppointments,
          revenue,
          newCustomerGrowth,
          appointmentBookingGrowth
        },
          revenueChangePercent
      });
    }

    // Mechanic view
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
  

// GET: Profile Page
router.get('/profile', verifyUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).lean();
    if (!user) {
      return res.render('dashboard/profile', { user: {}, success: null, error: 'User not found' });
    }
    res.render('dashboard/profile', { user, success: null, error: null });
  } catch (err) {
    console.error(err);
    res.render('dashboard/profile', { user: {}, success: null, error: 'Server error' });
  }
});

// POST: Update Profile Info
router.post('/profile', verifyUser, upload.single('profileImage'), async (req, res) => {
  try {
    const { fullName } = req.body;

    const update = { fullName };
    if (req.file) {
      update.profileImage = req.file.filename;
    }

    await User.findByIdAndUpdate(req.user.userId, update);

    const user = await User.findById(req.user.userId).lean();
    res.render('dashboard/profile', {
      user,
      success: 'Profile updated successfully.',
      error: null
    });
  } catch (err) {
    console.error(err);
    const user = await User.findById(req.user.userId).lean();
    res.render('dashboard/profile', {
      user,
      success: null,
      error: 'Failed to update profile.'
    });
  }
});

// POST: Change Password
router.post('/profile/change-password', verifyUser, async (req, res) => {
  try {
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
  } catch (err) {
    console.error(err);
    const user = await User.findById(req.user.userId).lean();
    res.render('dashboard/profile', {
      user,
      success: null,
      error: 'Error updating password.'
    });
  }
});

// POST: Delete Account
router.post('/profile/delete', verifyUser, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.userId);
    res.clearCookie('token');
    res.redirect('/register');
  } catch (err) {
    console.error(err);
    const user = await User.findById(req.user.userId).lean();
    res.render('dashboard/profile', {
      user,
      success: null,
      error: 'Error deleting account.'
    });
  }
});


module.exports = router;
