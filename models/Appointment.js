const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  vehicleNumber: {
    type: String,
    required: true,
  },
  serviceType: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
   // Timestamps
  time: { 
    type: String,
  },
  
  completedAt: { 
    type: String, 
  },

  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Completed' , 'Paid'],
    default: 'Pending',
  },
  mechanic: 
  { type: mongoose.Schema.Types.ObjectId,
    ref: 'User' 
  },

}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
