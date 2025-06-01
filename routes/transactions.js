// routes/transactions.js
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { verifyUser, requireRole } = require('../middleware/auth');
const puppeteer = require('puppeteer');
const path = require('path');
const ejs = require('ejs');
const sendInvoiceEmail = require('../utils/sendInvoiceEmail');

// GET - Payment page for completed appointment
router.get('/pay/:appointmentId', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('customer', 'fullName')
      .populate('mechanic', 'fullName');

    if (!appointment || appointment.status !== 'Completed') {
      return res.status(404).send('Completed appointment not found.');
    }

      // Calculate duration only if both date, time, and completedAt exist
    let durationText = 'N/A';

    if (appointment.time && appointment.completedAt && appointment.date) {
      const completedAtDate = new Date(appointment.completedAt);

      // Combine date and time manually
      const [hours, minutes] = appointment.time.split(':').map(Number);
      const appointmentDate = new Date(appointment.date);
      appointmentDate.setHours(hours);
      appointmentDate.setMinutes(minutes);
      appointmentDate.setSeconds(0);
      appointmentDate.setMilliseconds(0);

      const durationMs = completedAtDate - appointmentDate;

      if (durationMs > 0) {
        const totalMinutes = Math.floor(durationMs / (1000 * 60));
        const days = Math.floor(totalMinutes / (60 * 24));
        const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
        const minutes = totalMinutes % 60;

        const parts = [];
        if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
        if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
        if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);

        durationText = parts.join(' ');
      }
    }

    let startTime = 'N/A';
    let endTime = 'N/A';

        if (appointment.time && appointment.date) {
          const [hours, minutes] = appointment.time.split(':').map(Number);
          const appointmentDate = new Date(appointment.date);
          appointmentDate.setHours(hours);
          appointmentDate.setMinutes(minutes);
          appointmentDate.setSeconds(0);
          appointmentDate.setMilliseconds(0);
          startTime = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        if (appointment.completedAt) {
          const completedAtDate = new Date(appointment.completedAt);
          endTime = completedAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        let endDate = 'N/A';

        if (appointment.completedAt) {
          const completedAtDate = new Date(appointment.completedAt);
          endDate = completedAtDate.toLocaleDateString();
        }


    res.render('transactions/paymentForm', {
      appointment,
      customerName: appointment.customer.fullName || 'N/A',
      vehicleNumber: appointment.vehicleNumber,
      serviceType: appointment.serviceType,
      mechanicName: appointment.mechanic?.fullName || 'N/A',
      date: appointment.date ? appointment.date.toLocaleDateString(): 'N/A',
      durationText: durationText !== null ? durationText : 'N/A',
      startTime,
      endDate,
      endTime
    });



  } catch (err) {
    console.error('Error fetching appointment for payment:', err);
    res.status(500).send('Server error');
  }
});

// post - payement page
router.post('/pay/:appointmentId', verifyUser, requireRole('admin'), async (req, res) => {
  try {
    const { amount, method } = req.body;
    const appointmentId = req.params.appointmentId;

    const appointment = await Appointment.findById(appointmentId)
    .populate('customer', 'fullName email')
    .populate('mechanic', 'fullName');

    if (!appointment || appointment.status !== 'Completed') {
      return res.status(404).send('Appointment not found or not completed.');
    }

    // Duration Calculation
    let durationText = 'N/A';
    let startDate, startTime, endDate, endTime;

    if (appointment.time && appointment.date && appointment.completedAt) {
      const completedAt = new Date(appointment.completedAt);

      // Start time = appointment.date + appointment.time
      const [hours, minutes] = appointment.time.split(':').map(Number);
      const start = new Date(appointment.date);
      start.setHours(hours, minutes, 0, 0);
      startDate = start;
      endDate = completedAt;

      startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      endTime = completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Calculate duration
      const durationMs = completedAt - start;
      const totalMinutes = Math.floor(durationMs / (1000 * 60));
      const days = Math.floor(totalMinutes / (60 * 24));
      const hrs = Math.floor((totalMinutes % (60 * 24)) / 60);
      const mins = totalMinutes % 60;

      const parts = [];
      if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
      if (hrs > 0) parts.push(`${hrs} hour${hrs > 1 ? 's' : ''}`);
      if (mins > 0) parts.push(`${mins} minute${mins > 1 ? 's' : ''}`);

      durationText = parts.join(' ');
    }

    const transaction = new Transaction({
      appointment: appointmentId,
      customer: appointment.customer._id,
      amount,
      method,
      startDate,
      startTime,
      endDate,
      endTime,
      durationText,

      
      mechanicName: appointment.mechanic?.fullName || 'Unassigned',
      customerName: appointment.customer?.fullName || 'Unknown',
      vehicleNumber: appointment.vehicleNumber,
      serviceType: appointment.serviceType,
    });

    await transaction.save();



    try {
  await sendInvoiceEmail({
    customer: {
      name: appointment.customer.fullName,
      email: appointment.customer.email
    },
    mechanic: {
      name: appointment.mechanic?.fullName || 'Unassigned'
    },
    appointment,
    transaction,
    duration: durationText
  });
  console.log('Invoice sent to customer email.');
} catch (emailErr) {
  console.error('Invoice email failed:', emailErr);
}

     // 🔁 Update appointment status to "Paid"
    appointment.status = 'Paid';
    await appointment.save();
    
    req.flash('success_msg', 'Payment completed successfully!');
    res.redirect('/transactions/history');
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).send('Server error');
  }
});

// routes/transactions.js
router.get('/history', verifyUser, async (req, res) => {
  try {
    let transactions;

    if (req.user.role === 'admin') {
      // Admin: get all transactions and populate appointment + mechanic
      transactions = await Transaction.find()
        .populate('customer', 'fullName')
        .sort({ date: -1 })
        .lean();
    } else {
      // Customer: get only transactions for this customer
      transactions = await Transaction.find({ customer: req.user._id })
        .populate('customer', 'fullName')
        .sort({ date: -1 })
        .lean();
    }

    // Group transactions by date
    const grouped = transactions.reduce((groups, txn) => {
      const dateKey = txn.date.toISOString().slice(0, 10);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(txn);
      return groups;
    }, {});

    res.render('transactions/history', {
      groupedTransactions: grouped,
      userRole: req.user.role
    });

  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).send('Server error');
  }
});

// GET /transactions/invoice/:id
router.get('/invoice/:id', verifyUser, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).lean();

    if (!transaction) return res.status(404).send('Transaction not found');

    // Optional: Check if the user is allowed to view this invoice
    if (req.user.role !== 'admin' && !transaction.customer.equals(req.user._id)) {
      return res.status(403).send('Unauthorized');
    }

    res.render('transactions/invoice1', { transaction });
  } catch (err) {
    console.error('Invoice error:', err);
    res.status(500).send('Server error');
  }
});

// invoice download
router.get('/invoice/:id/download', verifyUser, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).lean();
    if (!transaction) return res.status(404).send('Transaction not found');

    // Check access
    if (req.user.role !== 'admin' && !transaction.customer.equals(req.user._id)) {
      return res.status(403).send('Unauthorized');
    }

    // Render invoice EJS to HTML
    const filePath = path.join(__dirname, '../views/transactions/invoice1.ejs');
    const html = await ejs.renderFile(filePath, { transaction });

    // Launch browser and create PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    // Send PDF as download
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${transaction._id}.pdf`,
    });
    res.send(pdfBuffer);

  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).send('Could not generate PDF');
  }
});

// routes/transactions.js
router.get('/customer/history', verifyUser, async (req, res) => {
  try {
    let transactions;

    if (req.user.role === 'admin') {
      transactions = await Transaction.find()
        .populate('customer', 'fullName')
        .sort({ date: -1 })
        .lean();

    } else {
      transactions = await Transaction.find({ customer: req.user._id })
        .populate('customer', 'fullName')
        .sort({ date: -1 })
        .lean();
    }

    const grouped = transactions.reduce((groups, txn) => {
      const dateKey = txn.date.toISOString().slice(0, 10);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(txn);
      return groups;
    }, {});

    res.render(
      req.user.role === 'admin' ? 'transactions/history' : 'transactions/customer-history',
      {
        groupedTransactions: grouped,
        userRole: req.user.role,
      }
    );
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).send('Server error');
  }
});



module.exports = router;
