const express = require('express');
const reportController = require('../controllers/reportController');
const { requireMentorOrCoach } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and mentor/coach role
router.use(requireMentorOrCoach);

// GET /api/reports/attendance - Get attendance summary (for web display)
router.get('/attendance', reportController.getAttendanceSummary);

// GET /api/reports/attendance-csv - Download attendance as CSV
router.get('/attendance-csv', reportController.getAttendanceReportCSV);

// GET /api/reports/audit - Download detailed audit report as text
router.get('/audit', reportController.getDetailedAuditReport);

// GET /api/reports/future - Get future absences summary
router.get('/future', reportController.getFutureAbsencesSummary);

// GET /api/reports/attendance-sessions - Attendance sessions report
router.get('/attendance-sessions', reportController.getAttendanceSessionsReport);

// GET /api/reports/absences - Absences report
router.get('/absences', reportController.getAbsencesReport);

// GET /api/reports/student-totals - Student totals report
router.get('/student-totals', reportController.getStudentTotalsReport);

// GET /api/reports/valid-sessions - Valid sessions report
router.get('/valid-sessions', reportController.getValidSessionsReport);

module.exports = router;
