const mongoose = require('mongoose');

const usedPartSchema = new mongoose.Schema({
  part: { type: mongoose.Schema.Types.ObjectId, ref: 'Part', required: true },
  quantity: { type: Number, required: true },
  mechanic: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  image: String,
  usedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UsedPart', usedPartSchema);
