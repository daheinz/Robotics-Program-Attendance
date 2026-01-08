const express = require('express');
const absenceController = require('../controllers/absenceController');
const { requireMentorOrCoach } = require('../middleware/auth');

const router = express.Router();

// Public minimal-read endpoint for presence board: absences by date
// GET /api/absences/public/by-date?date=YYYY-MM-DD&seasonType=build
router.get('/public/by-date', absenceController.getAbsencesForDatePublic);

// Remaining routes require authentication and mentor/coach role
router.use(requireMentorOrCoach);

// POST /api/absences - Create new absence record
router.post('/', absenceController.createAbsence);

// GET /api/absences/unapproved - Get all unapproved absences
router.get('/unapproved', absenceController.getUnapprovedAbsences);

// GET /api/absences/future - Get future absences
router.get('/future', absenceController.getFutureAbsences);

// GET /api/absences/:id - Get absence by ID
router.get('/:id', absenceController.getAbsenceById);

// GET /api/absences/:id/audit-log - Get audit log for absence
router.get('/:id/audit-log', absenceController.getAuditLog);

// GET /api/absences/student/:studentId - Get student absences in date range
router.get('/student/:studentId', absenceController.getStudentAbsences);

// GET /api/absences/student/:studentId/:absenceDate - Get absence for specific date
router.get('/student/:studentId/:absenceDate', absenceController.getAbsenceByStudentAndDate);

// PUT /api/absences/:id - Update absence (approve, change status, add notes)
router.put('/:id', absenceController.updateAbsence);
// DELETE /api/absences/:id - Delete absence record
router.delete('/:id', absenceController.deleteAbsence);


module.exports = router;
