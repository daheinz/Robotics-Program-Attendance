const express = require('express');
const router = express.Router();
const PresenceController = require('../controllers/presenceController');

// GET /presence/current - Get current presence board
router.get('/current', PresenceController.getCurrentPresence);

module.exports = router;
