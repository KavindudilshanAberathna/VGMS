const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  email: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  vehicleNumber: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  mechanicName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
    
    startDate: Date,
    startTime: String,
    endDate: Date,
    endTime: String,
    durationText: String,

  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['Cash', 'Card', 'Online'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Paid'
  },
  paidAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
