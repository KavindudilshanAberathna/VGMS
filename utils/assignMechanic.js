// utils/assignMechanic.js
const Mechanic = require('../models/Mechanic');

async function assignMechanic(serviceType, date, time) {
  const availableMechanics = await Mechanic.find({
    skills: serviceType
  }).populate('assignedAppointments');

  const targetDateTime = `${date}T${time}`;
  
  // Filter out busy mechanics
  const freeMechanics = availableMechanics.filter(m => {
    return !m.assignedAppointments.some(appt => {
      return `${appt.date}T${appt.time}` === targetDateTime;
    });
  });

  if (freeMechanics.length === 0) return null;

  // Pick mechanic with fewest assignments
  freeMechanics.sort((a, b) => a.assignedAppointments.length - b.assignedAppointments.length);
  return freeMechanics[0];
}

module.exports = assignMechanic;
