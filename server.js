const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// Routes and middleware
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const appointmentRoutes = require('./routes/appointmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const loadNotifications = require('./middleware/loadNotifications');
const { verifyUser } = require('./middleware/auth');

dotenv.config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected."))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// View engine setup
const engine = require('ejs-mate');
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// JWT Decode Middleware — sets `req.user`
app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
});

// Global `res.locals.user` injection for EJS views (for profile pic, name, etc.)
app.use(async (req, res, next) => {
  if (req.user && req.user._id) {
    try {
      const user = await User.findById(req.user._id).lean();
      res.locals.user = user;
    } catch (err) {
      console.error('User fetch failed:', err);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});

// Session and flash setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
}));
app.use(flash());

// Flash messages for EJS
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/appointments/admin', appointmentRoutes);
app.use(loadNotifications); // For all routes that need notifications
app.use('/notifications', notificationRoutes);

// Home route
app.get('/', (req, res) => {
  res.render('index', { title: "Vehicle Garage Management System" });
});

// Dashboard (if needed directly)
app.get('/dashboard', verifyUser, (req, res) => {
  res.render('dashboard', { user: req.user });
});

// Notifications view (optional, if you access this directly)
app.get('/notifications', verifyUser, (req, res) => {
  res.render('notifications/index', { user: req.user });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
