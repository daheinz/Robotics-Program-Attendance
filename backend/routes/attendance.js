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

const validateAdminUpdate = [
  body('checkInTime').isISO8601().withMessage('checkInTime is required and must be ISO8601'),
  body('checkOutTime').optional().isISO8601().withMessage('checkOutTime must be ISO8601 if provided'),
  body('auditReason').isString().withMessage('auditReason is required'),
  body('reflectionText').optional().isString(),
];

const validateAdminCreate = [
  body('userId').isUUID().withMessage('userId is required and must be valid'),
  body('checkInTime').isISO8601().withMessage('checkInTime is required and must be ISO8601'),
  body('checkOutTime').isISO8601().withMessage('checkOutTime is required and must be ISO8601'),
  body('auditReason').isString().withMessage('auditReason is required'),
  body('reflectionText').optional().isString(),
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

// GET /attendance/range?start_date&end_date&user_ids=comma,list
router.get('/range', requireMentorOrCoach, handleValidationErrors, AttendanceController.getByRange);

// GET /attendance/day?date=YYYY-MM-DD - Get attendance for a specific day
router.get('/day', requireMentorOrCoach, validateDate, handleValidationErrors, AttendanceController.getByDay);

// GET /attendance/export - Export attendance data (must come before /:sessionId to avoid conflict)
router.get('/export', requireMentorOrCoach, validateDateRange, handleValidationErrors, AttendanceController.export);

// POST /attendance/admin - Admin create session
router.post('/admin', requireMentorOrCoach, validateAdminCreate, handleValidationErrors, AttendanceController.adminCreate);

// GET /attendance/user/:userId/status - Get user's current session status (MUST BE BEFORE /user/:id)
router.get('/user/:userId/status', requireMentorOrCoach, param('userId').isUUID(), handleValidationErrors, AttendanceController.getUserStatus);

// GET /attendance/user/:id - Get attendance history for a user
router.get('/user/:id', requireMentorOrCoach, validateUserId, handleValidationErrors, AttendanceController.getByUser);

// GET /attendance/:sessionId/audit-log - Get audit log for an attendance session
router.get('/:sessionId/audit-log', requireMentorOrCoach, validateSessionId, handleValidationErrors, AttendanceController.getAuditLog);

// PATCH /attendance/:sessionId/admin - Admin update session
router.patch('/:sessionId/admin', requireMentorOrCoach, validateSessionId, validateAdminUpdate, handleValidationErrors, AttendanceController.adminUpdateSession);

// POST /attendance/user/:userId/quick-checkin - Quick check-in for today with just check-in time
router.post('/user/:userId/quick-checkin', requireMentorOrCoach, param('userId').isUUID(), body('checkInTime').isISO8601(), handleValidationErrors, AttendanceController.quickCheckIn);

// POST /attendance/user/:userId/quick-checkout - Quick check-out for today with just check-out time  
router.post('/user/:userId/quick-checkout', requireMentorOrCoach, param('userId').isUUID(), body('checkOutTime').isISO8601(), handleValidationErrors, AttendanceController.quickCheckOut);

// PATCH /attendance/:sessionId - Correct an attendance session
router.patch('/:sessionId', requireMentorOrCoach, validateSessionId, validateCorrectSession, handleValidationErrors, AttendanceController.correctSession);

// DELETE /attendance/:sessionId - Admin delete session
router.delete('/:sessionId', requireMentorOrCoach, validateSessionId, handleValidationErrors, AttendanceController.adminDelete);

// POST /attendance - Manually create an attendance session (generic catch-all, must be last)
router.post('/', requireMentorOrCoach, validateCreateManual, handleValidationErrors, AttendanceController.createManual);

module.exports = router;
