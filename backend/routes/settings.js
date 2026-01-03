const express = require('express');
const { body, validationResult } = require('express-validator');
const SettingsController = require('../controllers/settingsController');
const { requireMentorOrCoach, requireCoach } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateUpdateSettings = [
  body('reflectionPrompt').isString().trim().notEmpty().withMessage('Reflection prompt is required'),
];

// Error handler for validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /settings - Get system settings
router.get('/', requireMentorOrCoach, SettingsController.get);

// PATCH /settings - Update system settings
router.patch('/', requireCoach, validateUpdateSettings, handleValidationErrors, SettingsController.update);

module.exports = router;
