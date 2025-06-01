const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { getMechanicPerformance } = require('../controllers/mechanicsController');

router.get('/admin/mechanic-performance', async (req, res) => {
  try {
    const mechanics = await User.find({ role: 'mechanic' }).lean();

    const mechanicsWithPerformance = await Promise.all(
      mechanics.map(async (mechanic) => {
        const performanceScore = await getMechanicPerformance(mechanic._id);
        return { ...mechanic, performanceScore };
      })
    );

    res.render('performance/mechanics', { mechanics: mechanicsWithPerformance });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading mechanic performance');
  }
});


module.exports = router;
