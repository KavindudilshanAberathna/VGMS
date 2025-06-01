const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const sendNotification = require('../utils/sendNotification');


exports.registerUser = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.render('auth/register', { error: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const profileImage = req.file ? req.file.filename : 'default.jpg';

        const user = new User({
            fullName,
            email,
            password: hashedPassword,
            profileImage,
            role: 'customer'
        });

        await user.save();

        // 🔔 Send notification to admin(s)
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
        await sendNotification(admin._id, `🆕 New customer registered: ${req.body.fullName}`, '/dashboard/admin');
      }

        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.render('auth/register', { error: 'Registration failed' });
    }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.render('auth/login', { error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.render('auth/login', { error: 'Invalid credentials' });

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // redirect based on role
    const redirectPath = {
      admin: '/dashboard',
      mechanic: '/dashboard',
      customer: '/dashboard'
    };

    res.redirect(redirectPath[user.role]);
  } catch (err) {
    console.error('Login error:', err.message);
    res.render('auth/login', { error: 'Login failed' });
  }
};

exports.logoutUser = (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
};


exports.isAuthenticated = (req, res, next) => {
    if (req.user) {
        return next();
    }

    // Store return path for redirect after login
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
};
  
  
exports.logoutUser = (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
};
