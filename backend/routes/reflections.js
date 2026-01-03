const express = require('express');
const { param, validationResult } = require('express-validator');
const ReflectionController = require('../controllers/reflectionController');
const { requireMentorOrCoach } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateUserId = [
  param('id').isUUID().withMessage('Invalid user ID'),
];

// Error handler for validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /reflections - Get all reflections (admin)
router.get('/', requireMentorOrCoach, ReflectionController.getAll);

// GET /reflections/user/:id - Get reflections for a specific user
router.get('/user/:id', requireMentorOrCoach, validateUserId, handleValidationErrors, ReflectionController.getByUserId);

module.exports = router;
