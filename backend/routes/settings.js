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
  body('colorStudentCheckedIn').optional().isString().trim().notEmpty().withMessage('colorStudentCheckedIn must be a non-empty string'),
  body('colorMentorCheckedIn').optional().isString().trim().notEmpty().withMessage('colorMentorCheckedIn must be a non-empty string'),
  body('colorNotCheckedIn').optional().isString().trim().notEmpty().withMessage('colorNotCheckedIn must be a non-empty string'),
  body('colorPastSession').optional().isString().trim().notEmpty().withMessage('colorPastSession must be a non-empty string'),
  body('colorActiveSession').optional().isString().trim().notEmpty().withMessage('colorActiveSession must be a non-empty string'),
  body('colorCurrentTime').optional().isString().trim().notEmpty().withMessage('colorCurrentTime must be a non-empty string'),
  body('slideshowIntervalSeconds').optional().isInt({ min: 1, max: 3600 }).withMessage('slideshowIntervalSeconds must be between 1 and 3600'),
  body('slideshowPresenceEveryN').optional().isInt({ min: 1, max: 100 }).withMessage('slideshowPresenceEveryN must be between 1 and 100'),
  body('slideshowPresenceDurationSeconds').optional().isInt({ min: 1, max: 3600 }).withMessage('slideshowPresenceDurationSeconds must be between 1 and 3600'),
  body().custom((value, { req }) => {
    const hasAny = req.body.reflectionPrompt !== undefined
      || req.body.presenceStartHour !== undefined
      || req.body.presenceEndHour !== undefined
      || req.body.colorStudentCheckedIn !== undefined
      || req.body.colorMentorCheckedIn !== undefined
      || req.body.colorNotCheckedIn !== undefined
      || req.body.colorPastSession !== undefined
      || req.body.colorActiveSession !== undefined
      || req.body.colorCurrentTime !== undefined
      || req.body.slideshowIntervalSeconds !== undefined
      || req.body.slideshowPresenceEveryN !== undefined
      || req.body.slideshowPresenceDurationSeconds !== undefined;
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
router.patch('/', requireMentorOrCoach, validateUpdateSettings, handleValidationErrors, SettingsController.update);

module.exports = router;
