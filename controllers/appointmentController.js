const Appointment = require('../models/Appointment');

exports.getBookForm = (req, res) => {
  res.render('appointments/book', { user: req.user });
};

exports.bookAppointment = async (req, res) => {
  try {
    const { vehicleNumber, date, time, serviceType } = req.body;

    const appointment = new Appointment({
      customer: req.user._id,
      vehicleNumber,
      date,
      time,
      serviceType,
    });

    await appointment.save();
    res.redirect('/appointments/my');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error booking appointment');
  }
};

exports.getMyAppointments = async (req, res) => {
  const appointments = await Appointment.find({ customer: req.user._id }).sort({ date: 1 });
  res.render('appointments/my', { user: req.user, appointments });
};
