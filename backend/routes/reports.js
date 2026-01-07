const express = require('express');
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and mentor/coach role
router.use(auth);

// GET /api/reports/attendance - Get attendance summary (for web display)
router.get('/attendance', reportController.getAttendanceSummary);

// GET /api/reports/attendance-csv - Download attendance as CSV
router.get('/attendance-csv', reportController.getAttendanceReportCSV);

// GET /api/reports/audit - Download detailed audit report as text
router.get('/audit', reportController.getDetailedAuditReport);

// GET /api/reports/future - Get future absences summary
router.get('/future', reportController.getFutureAbsencesSummary);

module.exports = router;
