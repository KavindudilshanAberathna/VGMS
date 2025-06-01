const express = require('express');
const router = express.Router();
const mechanicController = require('../controllers/mechanicController');
const { verifyUser, requireRole } = require('../middleware/auth');

router.use(verifyUser);
router.use(requireRole('admin'));

router.get('/', mechanicController.getAllMechanics);
router.get('/add', mechanicController.getAddMechanicForm);
router.post('/add', mechanicController.addMechanic);

router.get('/edit/:id', mechanicController.getEditMechanicForm);
router.post('/edit/:id', mechanicController.updateMechanic);

router.post('/delete/:id', mechanicController.deleteMechanic);

module.exports = router;
