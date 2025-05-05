const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.verifyUser = async (req, res, next) => {
    try {
      const token = req.cookies.token;
      if (!token) {
        console.log("No token found");
        return res.redirect('/login');
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded._id);
      if (!user) {
        console.log("No user found");
        return res.redirect('/login');
      }
  
      req.user = {
        _id: user._id,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        userId: user._id
      };
  
      next(); // ✅ Proceed to the route
    } catch (err) {
      console.error("verifyUser error:", err.message);
      return res.redirect('/login');
    }
  };

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.render('auth/login', { error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('auth/login', { error: 'Invalid credentials' });

    const token = jwt.sign(
      { _id: user._id, role: user.role, fullName: user.fullName, email: user.email },
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
