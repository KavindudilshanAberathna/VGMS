const mongoose = require('mongoose');

const partSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: String,
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  description: String,
  image: String,
});

module.exports = mongoose.model('Part', partSchema);
