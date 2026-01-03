const { body, param, query, validationResult } = require('express-validator');

// Validation middleware to check for errors
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

// User validation rules
const userValidation = {
  create: [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('alias').trim().notEmpty().withMessage('Alias is required'),
    body('role').isIn(['student', 'mentor', 'coach']).withMessage('Invalid role'),
    body('pin').isLength({ min: 4, max: 6 }).withMessage('PIN must be 4-6 digits'),
  ],
  updateAlias: [
    body('alias').trim().notEmpty().withMessage('Alias is required'),
  ],
  updatePin: [
    body('pin').isLength({ min: 4, max: 6 }).withMessage('PIN must be 4-6 digits'),
  ],
};

// Contact validation rules
const contactValidation = {
  create: [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
  ],
};

// Kiosk validation rules
const kioskValidation = {
  checkIn: [
    body('alias').trim().notEmpty().withMessage('Alias is required'),
    body('pin').notEmpty().withMessage('PIN is required'),
  ],
  checkOut: [
    body('alias').trim().notEmpty().withMessage('Alias is required'),
    body('pin').notEmpty().withMessage('PIN is required'),
  ],
};

// Attendance validation rules
const attendanceValidation = {
  getByDay: [
    query('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
  ],
  export: [
    query('start_date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('start_date must be in YYYY-MM-DD format'),
    query('end_date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('end_date must be in YYYY-MM-DD format'),
  ],
};

// Settings validation rules
const settingsValidation = {
  update: [
    body('reflectionPrompt').trim().notEmpty().withMessage('Reflection prompt is required'),
  ],
};

module.exports = {
  validate,
  userValidation,
  contactValidation,
  kioskValidation,
  attendanceValidation,
  settingsValidation,
};
