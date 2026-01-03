const express = require('express');
const { body, validationResult } = require('express-validator');
const AuthController = require('../controllers/authController');

const router = express.Router();

// Validation middleware
const validateLogin = [
  body('alias').isString().trim().notEmpty().withMessage('Alias is required'),
  body('pin').isString().trim().notEmpty().withMessage('PIN is required'),
];

// Error handler for validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST /auth/login - Exchange alias + PIN for JWT
router.post('/login', validateLogin, handleValidationErrors, AuthController.login);

module.exports = router;
