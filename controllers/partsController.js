const sendNotification = require('../utils/sendNotification');
const User = require('../models/User');

// Inside mechanic use part logic
part.quantity -= usedQuantity;
await part.save();

// Low stock check
if (part.quantity <= 10) {
  const adminUsers = await User.find({ role: 'admin' });
  const message = `⚠️ Low stock alert for "${part.name}". Only ${part.quantity} left in inventory.`;

  for (let admin of adminUsers) {
    await sendNotification(admin._id, message);
  }
}
