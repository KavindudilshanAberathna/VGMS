const User = require('../models/User');
const bcrypt = require('bcrypt');

// View all mechanics
exports.getAllMechanics = async (req, res) => {
  const mechanics = await User.find({ role: 'mechanic' });
  res.render('mechanics/index', { mechanics });
};

// Render add mechanic form
exports.getAddMechanicForm = (req, res) => {
  res.render('mechanics/add');
};

// Handle add mechanic POST
exports.addMechanic = async (req, res) => {
  const { fullName, email, password } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).send('A user with this email already exists.');
    // Or render the form again with an error message
    // return res.render('mechanics/add', { error: 'Email already in use' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    fullName,
    email,
    password: hashedPassword,
    role: 'mechanic',
    profileImage: 'default.jpg'
  });

  res.redirect('/mechanics');
};


// Render edit mechanic form
exports.getEditMechanicForm = async (req, res) => {
  const mechanic = await User.findById(req.params.id);
  res.render('mechanics/edit', { mechanic });
};

// Handle update mechanic POST
exports.updateMechanic = async (req, res) => {
  const { fullName, email } = req.body;

  await User.findByIdAndUpdate(req.params.id, {
    fullName,
    email
  });

  res.redirect('/mechanics');
};

// Delete mechanic
exports.deleteMechanic = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect('/mechanics');
};

