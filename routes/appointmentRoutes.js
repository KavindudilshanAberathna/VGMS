const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { verifyUser, requireRole, isAuthenticated } = require('../middleware/auth');
const mongoose = require('mongoose');
const sendNotification = require('../utils/sendNotification');

// Book form – accessible to all
router.get('/book', (req, res) => {
  res.render('appointments/book', { user: req.user || null });
});

// Submit booking
router.post('/book', verifyUser, async (req, res) => {
  try {
    const { vehicleNumber, date, time, serviceType } = req.body;

    if (!vehicleNumber || !date || !time || !serviceType) {
      return res.send('Please fill in all fields.');
    }

    const appointment = new Appointment({
      customer: req.user.userId,  // Secure now
      vehicleNumber,
      date,
      time,
      serviceType
    });

    await appointment.save();

    const admin = await User.findOne({ role: { $regex: /^admin$/i } });
    if (admin) {
    await sendNotification(admin._id, 'New appointment booked!', '/appointments/admin/list');
    } else {
    console.warn('⚠️ Admin user not found for notification.');
    }


    res.redirect('/appointments/my');

  } catch (error) {
    console.error('Booking error:', error.message);
    res.send('Error booking appointment');
  }
});



// Customer view – authenticated
router.get('/my', verifyUser, async (req, res) => {
  try {
    const appointments = await Appointment.find({ customer: req.user.userId }).sort({ date: 1 });
    res.render('appointments/my', { user: req.user, appointments });
  } catch (error) {
    console.error('Appointment fetch error:', error.message);
    res.send('Error retrieving appointments');
  }
});

// Admin: list & assign
router.get('/list', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('customer')
      .populate('mechanic');

    const mechanics = await User.find({ role: 'mechanic' });

    res.render('appointments/adminList', { appointments, mechanics });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).send('Server error');
  }
});


router.post('/admin/:id/assign', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    const mechanicId = req.body.mechanicId;

    if (!appointment) return res.send('Appointment not found.');

    const conflict = await Appointment.findOne({
      mechanic: mechanicId,
      date: appointment.date,
      time: appointment.time
    });

    if (conflict) return res.send('Mechanic already booked for this time.');

    appointment.mechanic = mechanicId;
    appointment.status = 'Approved';

    await appointment.save();

    const mechanic = await User.findById(mechanicId);

    if (mechanic) {
      await sendNotification(
        mechanic._id,
        'Admin assigned you to a new appointment!',
        '/appointments/mechanic/appointments'
      );
      console.log('✅ Notification sent to mechanic:', mechanic.fullName);
      } else {
      console.warn('⚠️ Mechanic user not found for notification.');
      }

    res.redirect('/appointments/admin/assigned');
  } catch (error) {
    console.error('Assign error:', error);
    res.send('Error assigning mechanic.');
  }
});

// Mechanic: assigned appointments


router.get('/mechanic/appointments', verifyUser, requireRole('mechanic'), async (req, res) => {
  try {
    const appointments = await Appointment.find({
      mechanic: req.user._id, // ONLY appointments assigned to this mechanic
      status: { $in: ['Approved', 'Pending'] }
    }).populate('customer').lean();

    res.render('appointments/mechanicAppointments', {
      appointments,
      user: req.user
    });


  } catch (error) {
    console.error('Error loading mechanic appointments:', error);
    res.status(500).send('Server error');
  }
});


router.post('/mechanic/appointments/:id/complete', verifyUser, requireRole('mechanic'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('customer');

    if (!appointment) return res.send('Appointment not found.');

    if (!appointment.mechanic || appointment.mechanic.toString() !== req.user._id.toString()) {
      return res.status(403).send('Not authorized.');
    }

    appointment.status = 'Completed';
    await appointment.save();

    await sendNotification(
      appointment.customer._id,
      'Your appointment has been completed. Please pick up your vehicle. Thank you!',
      '/appointments/my'
    );

    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      const admin = await User.findOne({ role: { $regex: /^admin$/i } });
      if (admin) {
        await sendNotification(
          admin._id,
          `An appointment was completed by ${req.user.fullName || 'a mechanic'}.`,
          '/appointments/assigned'
        );
      }
    }

    if (isAdmin) {
      res.redirect('/appointments/admin/assigned');
    } else {
      res.redirect('/appointments/mechanic/appointments');
    }
  } catch (err) {
    console.error('❌ Error completing appointment:', err);
    res.status(500).send('Server error while completing appointment.');
  }
});

// Delete an appointment
router.post('/:id/delete', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.redirect('/appointments/admin/list');
  } catch (err) {
    console.error('Error deleting appointment:', err);
    res.status(500).send('Server Error');
  }
});

// View only assigned appointments
router.get('/assigned', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const appointments = await Appointment.find({ mechanic: { $ne: null } })
      .populate('customer', 'fullName email')
      .populate('mechanic', 'fullName');

    res.render('appointments/assignedList', { appointments });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Edit appointment status
router.post('/:id/edit', verifyUser, requireRole('admin',), async (req, res) => {
  try {
    const { status } = req.body;
    await Appointment.findByIdAndUpdate(req.params.id, { status });
    res.redirect('/appointments/admin/assigned');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating appointment');
  }
});

// Delete appointment
router.post('/:id/delete', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.redirect('/appointments/admin/assigned');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting appointment');
  }
});

// View service history (completed appointments)
router.get('/mechanic/history', verifyUser, requireRole('mechanic'), async (req, res) => {
  try {
    const completedAppointments = await Appointment.find({
      mechanic: req.user._id,
      status: 'Completed'
    })
      .populate('customer')
      .sort({ date: -1 });

    res.render('appointments/mechanicHistory', { appointments: completedAppointments });
  } catch (error) {
    console.error('Error fetching service history:', error);
    res.status(500).send('Server error');
  }
});



module.exports = router;
