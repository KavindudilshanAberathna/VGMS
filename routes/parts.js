const express = require('express');
const router = express.Router();
const { verifyUser, requireRole } = require('../middleware/auth');
const Part = require('../models/Part');
const UsedPart = require('../models/UsedPart');
const Appointment = require('../models/Appointment');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const BookedPart = require('../models/BookedPart');

// Storage config for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads'); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Admin: View Inventory
router.get('/inventory', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const parts = await Part.find(); // Fetch updated parts
    res.render('parts/inventory', { parts });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Admin: Add Part
router.post('/inventory/add', verifyUser, requireRole('admin'), upload.single('image'), async (req, res) => {
    try {

        if (!req.body){
            return res.status(400).send("Form data not submitted correctly.");
        }
            const { name, brand, quantity, unitPrice, description } = req.body;
            const image = req.file ? req.file.filename : null;

            const newPart = new Part({
                name,
                brand,
                description,
                quantity,
                unitPrice,
                image,
                });
                
                await newPart.save();
                res.redirect('/parts/inventory');
            }
                catch (err) {
                console.error(err);
                res.status(500).send('Error adding part');
            }
});

// Edit Part - GET
router.get('/inventory/edit/:id', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const part = await Part.findById(req.params.id);
    if (!part) return res.status(404).send('Part not found');
    res.render('parts/edit', { part });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading part');
  }
});

// Edit Part - POST
router.post('/inventory/edit/:id', verifyUser, requireRole('admin'), upload.single('image'), async (req, res) => {
  try {
    const { name, brand, quantity, unitPrice, description } = req.body;
    const update = {
      name,
      brand,
      quantity,
      unitPrice,
      description,
    };

    if (req.file) {
      update.image = req.file.filename;
    }

    await Part.findByIdAndUpdate(req.params.id, update);
    res.redirect('/parts/inventory');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating part');
  }
});

// Delete part by ID
router.post('/inventory/delete/:id', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const part = await Part.findById(req.params.id);
    if (!part) return res.status(404).send('Part not found');

    if (part.image) {
      const imagePath = path.join(__dirname, '..', 'public', 'uploads', part.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await Part.findByIdAndDelete(req.params.id);
    res.redirect('/parts/inventory');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to delete part');
  }
});

// GET mechanic view parts page
router.get('/mechanic', verifyUser, requireRole('mechanic'), async (req, res) => {
  try {
    const mechanicId = req.user._id;

    // Find only assigned appointments for the logged-in mechanic
    const appointments = await Appointment.find({ mechanic: mechanicId, status: 'Approved' })
      .populate('customer', 'fullName email');

    const parts = await Part.find();

    res.render('parts/mechanic_inventory', { appointments, parts });
  } catch (error) {
    console.error('Error loading mechanic inventory:', error);
    res.status(500).send('Server error');
  }
});

// POST mechanic uses a part
router.post('/mechanic/use', verifyUser, requireRole('mechanic'), async (req, res) => {
  try {
    const { partId, quantity, appointmentId } = req.body;
    const mechanicId = req.user.id;

    const usedQuantity = parseInt(quantity); // ✅ Convert string to number

    const part = await Part.findById(partId);
    if (!part) return res.status(404).send('Part not found');
    if (part.quantity < usedQuantity) return res.status(400).send('Insufficient stock');

    // Find the appointment (and get customer)
    const appointment = await Appointment.findById(appointmentId).populate('customer');
    if (!appointment) return res.status(404).send('Appointment not found');

    // Reduce inventory quantity
    part.quantity -= usedQuantity;
    await part.save();

    // Save used part record
    const usedPart = new UsedPart({
      part: partId,
      quantity: usedQuantity,
      customer: appointment.customer._id,
      mechanic: mechanicId,
      appointment: appointmentId,
    });
    await usedPart.save();

    res.redirect('/parts/mechanic/used');
  } catch (error) {
    console.error('Error using part:', error);
    res.status(500).send('Server error');
  }
});


// GET mechanic used parts list
router.get('/mechanic/used', verifyUser, requireRole('mechanic'), async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const usedParts = await UsedPart.find({ mechanic: mechanicId })
        .populate('customer', 'fullName')
        .populate('part', 'name')
        .populate({ path: 'part', select: 'name image'})
        .populate('appointment', 'time')
        .populate('mechanic', 'fullName')
        .sort({ createdAt: -1 });

    res.render('parts/mechanic_used_parts', { usedParts });
  } catch (error) {
    console.error('Error loading used parts:', error);
    res.status(500).send('Server error');
  }
});

// Get customer used parts
router.get('/customer/used', verifyUser, requireRole('customer'), async (req, res) => {
  try {
    const customerId = req.user.id;

    const usedParts = await UsedPart.find({ customer: customerId })
      .populate('part')
      .populate({
        path: 'appointment',
        select: 'time',
      })
      .populate({
        path: 'mechanic',
        select: 'fullName',
      });

    res.render('parts/customerUsedParts', { usedParts });
  } catch (error) {
    console.error('Error fetching customer used parts:', error);
    res.status(500).send('Server error');
  }
});

//Admin view all mechanic used parts
router.get('/admin/used', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const usedParts = await UsedPart.find()
      .populate('part')
      .populate('mechanic', 'fullName')
      .populate('customer', 'fullName')
      .sort({ usedAt: -1 });

    res.render('parts/adminUsedParts', { usedParts });
  } catch (err) {
    console.error('Error loading used parts for admin:', err);
    res.status(500).send('Server Error');
  }
});

// low stock alerts
router.get('/admin/low-stock', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const LOW_STOCK_LIMIT = 5;

    const lowStockParts = await Part.find({ quantity: { $lte: LOW_STOCK_LIMIT } });

    res.render('parts/lowStockAlert', { lowStockParts });
  } catch (err) {
    console.error('Error fetching low stock parts:', err);
    res.status(500).send('Server Error');
  }
});

// shop inventory
router.get('/customer/book-parts', verifyUser, requireRole('customer'), async (req, res) => {
  try {
    const customerId = req.user.id;
    const parts = await Part.find();

    const bookings = await BookedPart.find({ customer: customerId })
      .populate('part')
      .sort({ bookedAt: -1 });

    res.render('parts/book_parts', { parts,bookings });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// post Booking request
router.post('/customer/book', verifyUser, requireRole('customer'), async (req, res) => {
  try {
    const { partId, quantity } = req.body;
    const customerId = req.user.id;

    const bookedPart = new BookedPart({
      part: partId,
      customer: customerId,
      quantity
    });

    await bookedPart.save();
    res.redirect('/parts/customer/book-parts');
  } catch (err) {
    console.error('Error booking part:', err);
    res.status(500).send('Booking failed');
  }
});

// admin view booked parts
router.get('/admin/bookings', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const bookings = await BookedPart.find()
      .populate('part')
      .populate('customer', 'fullName email')
      .sort({ bookedAt: -1 });

    res.render('parts/admin_bookings', { bookings });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to load bookings');
  }
});

// Admin edit status
router.post('/bookings/:id/status', async (req, res) => {
  const bookingId = req.params.id;
  const { status } = req.body;

  try {
    const booking = await BookedPart.findById(bookingId).populate('part');

    if (!booking) {
      return res.status(404).send('Booking not found');
    }

    // If status is being changed to Approved, subtract quantity from inventory
    if (status === 'Approved' && booking.status !== 'Approved') {
      const part = await Part.findById(booking.part._id);

      if (part.quantity < booking.quantity) {
        return res.status(400).send('Not enough stock');
      }

      part.quantity -= booking.quantity;
      await part.save();
    }

    booking.status = status;
    await booking.save();

    res.redirect('/parts/admin/bookings');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


module.exports = router;
