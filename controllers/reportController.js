const Appointment = require('../models/Appointment');
const Transaction = require('../models/Transaction');

// Helper to group and count items by a field
function groupAndCount(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key];
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

exports.getPredictiveReports = async (req, res) => {
  try {
    const now = new Date();
    const lastThreeMonths = new Date(now);
    lastThreeMonths.setMonth(now.getMonth() - 3);

    const appointments = await Appointment.find({
      time: { $gte: lastThreeMonths },
      status: 'Completed'
    }).lean();

    const transactions = await Transaction.find({
      paidAt: { $gte: lastThreeMonths },
      status: 'Paid'
    }).lean();

    // --- Service Demand Forecast ---
    const serviceCounts = groupAndCount(appointments, 'serviceType');

    const sortedServices = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([service, count]) => ({ service, count }));

    // --- Revenue Forecast ---
    const revenueByMonth = {};
    transactions.forEach(tx => {
      const monthKey = new Date(tx.paidAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + (tx.amount || 0);
    });

    // --- Maintenance Trends ---
    const vehicleTypeCounts = groupAndCount(appointments, 'vehicleType');

    res.render('reports/predictive', {
      serviceTrends: sortedServices,
      revenueTrends: revenueByMonth,
      maintenanceTrends: vehicleTypeCounts
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating predictive reports');
  }
};
