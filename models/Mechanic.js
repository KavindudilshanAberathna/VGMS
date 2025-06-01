const mongoose = require('mongoose');

const mechanicSchema = new mongoose.Schema({
  name: String
});

module.exports = mongoose.model('Mechanic', mechanicSchema);
