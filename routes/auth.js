// routes/auth.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authController = require('../controllers/authController');

// File Upload Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.get('/register', (req, res) => {
    res.render('auth/register', { error: null });
});

router.post('/register', upload.single('profileImage'), authController.registerUser);

router.get('/login', (req, res) => {
    res.render('auth/login', { error: null });
});

router.post('/login', authController.loginUser);

router.get('/logout', authController.logoutUser);



module.exports = router;
