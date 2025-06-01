const User = require('../models/User');

const setUser = async (req, res, next) => {
  if (req.user && req.user.userId) {
    try {
      const user = await User.findById(req.user.userId).lean();
      res.locals.user = user;
    } catch (err) {
      console.error('User load error:', err);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
};

module.exports = setUser;
