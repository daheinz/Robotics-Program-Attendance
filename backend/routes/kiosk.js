const express = require('express');
const router = express.Router();
const KioskController = require('../controllers/kioskController');

// GET /kiosk/users - Get active users for kiosk
router.get('/users', KioskController.getUsers);

// POST /kiosk/check-in - Check in a user
router.post('/check-in', KioskController.checkIn);

// POST /kiosk/check-out - Check out a user
router.post('/check-out', KioskController.checkOut);

// GET /kiosk/reflection-prompt - Get current reflection prompt
router.get('/reflection-prompt', KioskController.getReflectionPrompt);

module.exports = router;
