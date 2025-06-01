const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.verifyUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id).lean();
    if (!user) return res.redirect('/login');

    req.user = {
      id: user._id,
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    };
    

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.redirect('/login');
  }
};

exports.requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).send('Access denied');
    }
    next();
  };
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.render('auth/login', { error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('auth/login', { error: 'Invalid credentials' });

    const token = jwt.sign(
      { _id: user._id, id: user._id, role: user.role, fullName: user.fullName, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    // Redirect based on role
    if (user.role === 'admin') {
      res.redirect('/admin/dashboard');
    } else if (user.role === 'mechanic') {
      res.redirect('/mechanic/dashboard');
    } else {
      res.redirect('/dashboard'); // customer
    }

  } catch (err) {
    console.error(err);
    res.render('auth/login', { error: 'Login failed' });
  }
};

exports.requireRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).send('Access denied.');
        }
        next();
    };
};

exports.isAuthenticated = (req, res, next) => {
    if (req.user) {
        return next();
    }

    // Store return path for redirect after login
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
};


