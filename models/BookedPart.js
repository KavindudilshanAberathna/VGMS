// models/BookedPart.js
const mongoose = require('mongoose');

const bookedPartSchema = new mongoose.Schema({
  part: { type: mongoose.Schema.Types.ObjectId, ref: 'Part', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quantity: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  bookedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BookedPart', bookedPartSchema);
