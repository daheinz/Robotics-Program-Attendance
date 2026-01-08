const express = require('express');
const { body, validationResult } = require('express-validator');
const SettingsController = require('../controllers/settingsController');
const { requireMentorOrCoach, requireCoach } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateUpdateSettings = [
  body('reflectionPrompt').optional().isString().trim().notEmpty().withMessage('Reflection prompt must be a non-empty string'),
  body('presenceStartHour').optional().isInt({ min: 0, max: 23 }).withMessage('presenceStartHour must be between 0 and 23'),
  body('presenceEndHour').optional().isInt({ min: 1, max: 24 }).withMessage('presenceEndHour must be between 1 and 24'),
  body().custom((value, { req }) => {
    const hasAny = req.body.reflectionPrompt !== undefined || req.body.presenceStartHour !== undefined || req.body.presenceEndHour !== undefined;
    if (!hasAny) {
      throw new Error('At least one setting field is required');
    }
    if (req.body.presenceStartHour !== undefined && req.body.presenceEndHour !== undefined) {
      if (Number(req.body.presenceStartHour) >= Number(req.body.presenceEndHour)) {
        throw new Error('presenceStartHour must be less than presenceEndHour');
      }
    }
    return true;
  })
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

// GET /settings/public - Get limited settings (read-only, no auth)
router.get('/public', SettingsController.getPublic);

// PATCH /settings - Update system settings
router.patch('/', requireCoach, validateUpdateSettings, handleValidationErrors, SettingsController.update);

module.exports = router;
