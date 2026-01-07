const express = require('express');
const coreHoursController = require('../controllers/coreHoursController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and mentor/coach role
router.use(auth);

// POST /api/core-hours - Create new core hours
router.post('/', coreHoursController.createCoreHours);

// GET /api/core-hours - Get all core hours (with optional seasonType filter)
router.get('/', coreHoursController.getAllCoreHours);

// GET /api/core-hours/season/:seasonType - Get core hours for a specific season
router.get('/season/:seasonType', coreHoursController.getCoreHoursBySeasonType);

// GET /api/core-hours/day/:dayOfWeek - Get core hours for a specific day
router.get('/day/:dayOfWeek', coreHoursController.getCoreHoursByDay);

// PUT /api/core-hours/:id - Update core hours
router.put('/:id', coreHoursController.updateCoreHours);

// DELETE /api/core-hours/:id - Delete (soft delete) core hours
router.delete('/:id', coreHoursController.deleteCoreHours);

module.exports = router;
