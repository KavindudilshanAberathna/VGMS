const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Appointment = require('../models/Appointment');
const { verifyUser, requireRole } = require('../middleware/auth');

// GET - Feedback form for paid appointments
router.get('/give/:appointmentId', verifyUser, async (req, res) => {
  const appointmentId = req.params.appointmentId;

  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate('mechanic')   // ✅ make sure to populate mechanic
      .populate('customer');  // optional: populate customer too

    if (!appointment) {
      return res.status(404).send('Appointment not found');
    }

    res.render('feedbacks/giveFeedback', { appointment });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// POST - Submit feedback
router.post('/give/:appointmentId', verifyUser, requireRole('customer'), async (req, res) => {
  const { title, message, rating, mechanicRating } = req.body;

  // ✅ Fetch the appointment first
  const appointment = await Appointment.findById(req.params.appointmentId);

  if (!appointment) {
    return res.status(404).send('Appointment not found');
  }

  await Feedback.create({
    customer: req.user._id,
    appointment: req.params.appointmentId,
    mechanic: appointment.mechanic,
    title,
    message,
    rating,
    mechanicRating: appointment.mechanic ? mechanicRating : undefined,
    published: false
  });

  res.redirect('/appointments/my?feedbackGiven=true');
});

// GET - Admin view all feedbacks
router.get('/admin', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('customer', 'fullName email')
      .populate({
        path: 'appointment',
        populate: { path: 'mechanic', select: 'fullName email' }
      })
      .sort({ createdAt: -1 });

    res.render('feedbacks/adminFeedbacks', { feedbacks });
  } catch (error) {
    console.error('Error loading feedbacks:', error);
    res.status(500).send('Server error');
  }
});

// POST - Toggle publish status
router.post('/:id/publish', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).send('Feedback not found');

    feedback.published = !feedback.published;
    await feedback.save();

    res.redirect('/feedbacks/admin');
  } catch (err) {
    console.error('Error updating publish status:', err);
    res.status(500).send('Server error');
  }
});

// POST - Delete feedback
router.post('/:id/delete', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.redirect('/feedbacks/admin');
  } catch (err) {
    console.error('Error deleting feedback:', err);
    res.status(500).send('Server error');
  }
});

// GET - Customer's own feedbacks
router.get('/my', verifyUser, requireRole('customer'), async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ customer: req.user._id })
      .populate({
        path: 'appointment',
        populate: { path: 'mechanic', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    res.render('feedbacks/myFeedbacks', { currentUser: req.user , feedbacks });
  } catch (err) {
    console.error('Error fetching customer feedbacks:', err);
    res.send('Failed to load your feedbacks.');
  }
});

// GET - Mechanic view their feedbacks
router.get('/mechanic', verifyUser, requireRole('mechanic'), async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ mechanic: req.user._id })
      .populate('customer', 'fullName email')
      .populate('appointment', 'date time')
      .sort({ createdAt: -1 });

    res.render('feedbacks/mechanicFeedbacks', { feedbacks });
  } catch (error) {
    console.error('Mechanic feedback error:', error.message);
    res.status(500).send('Error loading your feedbacks.');
  }
});




module.exports = router;
