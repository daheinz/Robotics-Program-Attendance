const express = require('express');
const coreHoursController = require('../controllers/coreHoursController');
const { requireMentorOrCoach } = require('../middleware/auth');

const router = express.Router();

// READ endpoints (public): allow presence board to display required practice times
router.get('/', coreHoursController.getAllCoreHours);
router.get('/season/:seasonType', coreHoursController.getCoreHoursBySeasonType);
router.get('/day/:dayOfWeek', coreHoursController.getCoreHoursByDay);

// WRITE endpoints (protected): require mentor/coach
router.post('/', requireMentorOrCoach, coreHoursController.createCoreHours);
router.put('/:id', requireMentorOrCoach, coreHoursController.updateCoreHours);
router.delete('/:id', requireMentorOrCoach, coreHoursController.deleteCoreHours);

module.exports = router;
