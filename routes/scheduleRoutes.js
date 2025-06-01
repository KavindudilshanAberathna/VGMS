const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { verifyUser, requireRole } = require('../middleware/auth');

// ADMIN - View all schedules
router.get('/admin', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const { month, year } = req.query;

    const appointments = await Appointment.find()
      .populate('customer')
      .populate('mechanic')
      .sort({ time: 1 });

    res.render('schedule/adminSchedule', {
      appointments,
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
    });
  } catch (err) {
    res.status(500).send('Error fetching schedule');
  }
});

// routes/schedule.js or routes/appointments.js
router.get('/mechanic', verifyUser, requireRole('mechanic'), async (req, res) => {
  try {

    const { month, year } = req.query;
    const mechanicId = req.user._id;

    const appointments = await Appointment.find({ mechanic: mechanicId }) // only those assigned to this mechanic
      .populate('customer')
      .sort({ date: 1 });

    console.log("Appointments for this mechanic:", appointments); // debug

    res.render('schedule/mechanicSchedule', { appointments,month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined, });
  } catch (err) {
    console.error('Mechanic Schedule Error:', err);
    res.status(500).send('Server Error');
  }
});




module.exports = router;
