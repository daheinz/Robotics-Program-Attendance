const express = require('express');
const { body, param, validationResult } = require('express-validator');
const UserController = require('../controllers/userController');
const { requireMentorOrCoach, requireCoach } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateCreateUser = [
  body('firstName').isString().trim().notEmpty().withMessage('First name is required'),
  body('lastName').isString().trim().notEmpty().withMessage('Last name is required'),
  body('alias').isString().trim().notEmpty().withMessage('Alias is required'),
  body('role').isIn(['student', 'mentor', 'coach']).withMessage('Role must be student, mentor, or coach'),
  body('pin').isString().trim().notEmpty().withMessage('PIN is required'),
  body('middleName').optional().isString(),
];

const validateUpdateUser = [
  body('firstName').optional().isString().trim().notEmpty(),
  body('lastName').optional().isString().trim().notEmpty(),
  body('middleName').optional().isString().trim(),
  body('pin').optional().isString().trim().notEmpty().withMessage('PIN, if provided, must be a non-empty string'),
];

const validateUpdateAlias = [
  body('alias').isString().trim().notEmpty().withMessage('Alias is required'),
];

const validateUpdatePin = [
  body('pin').isString().trim().notEmpty().withMessage('PIN is required'),
];

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

// GET /users - Get all users
router.get('/', requireMentorOrCoach, UserController.getAll);

// POST /users - Create new user
router.post('/', requireMentorOrCoach, validateCreateUser, handleValidationErrors, UserController.create);

// GET /users/:id - Get user by ID
router.get('/:id', requireMentorOrCoach, validateUserId, handleValidationErrors, UserController.getById);

// PATCH /users/:id - Update user
router.patch('/:id', requireMentorOrCoach, validateUserId, validateUpdateUser, handleValidationErrors, UserController.update);

// PATCH /users/:id/alias - Update user alias
router.patch('/:id/alias', requireMentorOrCoach, validateUserId, validateUpdateAlias, handleValidationErrors, UserController.updateAlias);

// PATCH /users/:id/pin - Update user PIN (coach or mentor)
router.patch('/:id/pin', requireMentorOrCoach, validateUserId, validateUpdatePin, handleValidationErrors, UserController.updatePin);

// DELETE /users/:id - Soft delete user
router.delete('/:id', requireCoach, validateUserId, handleValidationErrors, UserController.delete);

module.exports = router;
