const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// List all users
router.get('/',  async (req, res) => {
  try {
    const users = await User.find({});
    res.render('admin/users', { users });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Upload config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET edit form
router.get('/edit/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.render('admin/editUser', { user });
  } catch (err) {
    res.status(500).send('User not found');
  }
});

// POST edit submission
router.post('/edit/:id', upload.single('profileImage'), async (req, res) => {
  try {
    const { fullName, email, role, status } = req.body;

    const updateData = { fullName, email, role, status };

    if (req.file) {
      updateData.profileImage = req.file.filename;
    }

    await User.findByIdAndUpdate(req.params.id, updateData);
    res.redirect('/admin/users');
  } catch (err) {
    res.status(500).send('Update failed');
  }
});

// POST delete user
router.post('/delete/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/users');
  } catch (err) {
    res.status(500).send('Delete failed');
  }
});

module.exports = router;
