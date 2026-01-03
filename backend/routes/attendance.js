const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const AttendanceController = require('../controllers/attendanceController');
const { requireMentorOrCoach, requireAuth } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateDate = [
  query('date').isISO8601().withMessage('Date must be in YYYY-MM-DD format'),
];

const validateDateRange = [
  query('start_date').isISO8601().withMessage('start_date must be in YYYY-MM-DD format'),
  query('end_date').isISO8601().withMessage('end_date must be in YYYY-MM-DD format'),
];

const validateUserId = [
  param('id').isUUID().withMessage('Invalid user ID'),
];

const validateSessionId = [
  param('sessionId').isUUID().withMessage('Invalid session ID'),
];

const validateCorrectSession = [
  body('checkInTime').optional().isISO8601(),
  body('checkOutTime').optional().isISO8601(),
];

const validateCreateManual = [
  body('userId').isUUID().withMessage('User ID is required and must be valid'),
  body('checkInTime').isISO8601().withMessage('Check-in time is required and must be ISO8601'),
  body('checkOutTime').optional().isISO8601(),
];

// Error handler for validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST /attendance/check-in - Check in authenticated user
router.post('/check-in', requireAuth, AttendanceController.checkIn);

// POST /attendance/check-out - Check out authenticated user
const validateCheckOut = [
  body('reflectionText').optional().isString(),
];
router.post('/check-out', requireAuth, validateCheckOut, handleValidationErrors, AttendanceController.checkOut);

// GET /attendance/me - Get current user's attendance status
router.get('/me', requireAuth, AttendanceController.getCurrentUserStatus);

// GET /attendance/timeline?date=YYYY-MM-DD - Get timeline data (public, no auth required)
router.get('/timeline', validateDate, handleValidationErrors, AttendanceController.getTimeline);

// GET /attendance/day?date=YYYY-MM-DD - Get attendance for a specific day
router.get('/day', requireMentorOrCoach, validateDate, handleValidationErrors, AttendanceController.getByDay);

// GET /attendance/export - Export attendance data (must come before /:sessionId to avoid conflict)
router.get('/export', requireMentorOrCoach, validateDateRange, handleValidationErrors, AttendanceController.export);

// GET /attendance/user/:id - Get attendance history for a user
router.get('/user/:id', requireMentorOrCoach, validateUserId, handleValidationErrors, AttendanceController.getByUser);

// PATCH /attendance/:sessionId - Correct an attendance session
router.patch('/:sessionId', requireMentorOrCoach, validateSessionId, validateCorrectSession, handleValidationErrors, AttendanceController.correctSession);

// POST /attendance - Manually create an attendance session (generic catch-all, must be last)
router.post('/', requireMentorOrCoach, validateCreateManual, handleValidationErrors, AttendanceController.createManual);

module.exports = router;
