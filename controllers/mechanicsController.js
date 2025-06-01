const Appointment = require('../models/Appointment');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

// Helper: Calculate mechanic performance
async function getMechanicPerformance(mechanicId) {
  const completedAppointments = await Appointment.find({
    mechanic: mechanicId,
    status: 'Completed',
    completedAt: { $exists: true }
  }).lean();

  const efficiencyScores = completedAppointments.map(app => {
    const expected = app.expectedDurationInMinutes || 60; // fallback if not set
    const actual = (app.completedAt - app.time) / (1000 * 60); // time = appointmentTime

    let efficiency = expected / actual;
    efficiency = Math.max(0, Math.min(1, efficiency)); // Clamp between 0 and 1
    return efficiency;
  });

  const avgEfficiency = efficiencyScores.length
    ? efficiencyScores.reduce((a, b) => a + b, 0) / efficiencyScores.length
    : 0;

  const feedbacks = await Feedback.find({ mechanic: mechanicId }).lean();
  const avgFeedback = feedbacks.length
    ? feedbacks.reduce((a, f) => a + f.rating, 0) / feedbacks.length
    : 0;

  const performanceScore = ((avgEfficiency * 0.5) + (avgFeedback / 5 * 0.5)) * 100;
  return performanceScore.toFixed(2);
}



module.exports = {
  getMechanicPerformance
};
