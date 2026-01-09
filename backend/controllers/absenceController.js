const Absence = require('../models/Absence');
const User = require('../models/User');

// Create new absence record
exports.createAbsence = async (req, res, next) => {
  try {
    const { studentId, absenceDate, dayOfWeek, notes = '', approvedBy = null, status = 'unapproved', seasonType = 'build' } = req.body;
    const createdBy = req.user?.id;

    if (!createdBy) {
      return res.status(401).json({ error: 'User ID required for audit logging' });
    }
    
    // Validate input
    if (!studentId || !absenceDate || dayOfWeek === undefined) {
      return res.status(400).json({ error: 'studentId, absenceDate, and dayOfWeek are required' });
    }
    
    // Verify student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'dayOfWeek must be 0-6' });
    }
    
    if (status !== 'approved' && status !== 'unapproved') {
      return res.status(400).json({ error: 'status must be "approved" or "unapproved"' });
    }
    
    const absence = await Absence.create({ 
      studentId, 
      absenceDate, 
      dayOfWeek, 
      status, 
      notes, 
      approvedBy, 
      seasonType,
      createdBy,
    });
    
    res.status(201).json(absence);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Absence already exists for this student on this date' });
    }
    next(error);
  }
};

// Public: Get absences summary for a specific date (minimal fields)
// Responds with array of { student_id, status }
exports.getAbsencesForDatePublic = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const seasonType = req.query.seasonType || null;
    const rows = await Absence.findByDateSummary(date, seasonType);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// Get absence by ID
exports.getAbsenceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const absence = await Absence.findById(id);
    
    if (!absence) {
      return res.status(404).json({ error: 'Absence not found' });
    }
    
    res.json(absence);
  } catch (error) {
    next(error);
  }
};

// Get all unapproved absences
exports.getUnapprovedAbsences = async (req, res, next) => {
  try {
    const absences = await Absence.findUnapproved();
    res.json(absences);
  } catch (error) {
    next(error);
  }
};

// Get student absences in date range
exports.getStudentAbsences = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }
    
    // Verify student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const absences = await Absence.findByStudentAndDateRange(studentId, startDate, endDate);
    res.json(absences);
  } catch (error) {
    next(error);
  }
};

// Update absence (approve, add notes, etc.)
exports.updateAbsence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, approvedBy } = req.body;
    const updatedBy = req.user?.id; // Assuming middleware sets this
    
    if (!updatedBy) {
      return res.status(401).json({ error: 'User ID required for audit logging' });
    }
    
    const absence = await Absence.findById(id);
    if (!absence) {
      return res.status(404).json({ error: 'Absence not found' });
    }
    
    const updatedAbsence = await Absence.update(id, { 
      status, 
      notes, 
      approvedBy, 
      updatedBy 
    });
    
    res.json(updatedAbsence);
  } catch (error) {
    next(error);
  }
};

// Get audit log for an absence
exports.getAuditLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const absence = await Absence.findById(id);
    if (!absence) {
      return res.status(404).json({ error: 'Absence not found' });
    }
    
    const logs = await Absence.getAuditLog(id);
    res.set('Cache-Control', 'no-store');
    res.status(200).json({ absenceId: id, logs });
  } catch (error) {
    next(error);
  }
};

// Get all absences for a student on a specific date
exports.getAbsenceByStudentAndDate = async (req, res, next) => {
  try {
    const { studentId, absenceDate } = req.params;
    
    const absence = await Absence.findByStudentAndDate(studentId, absenceDate);
    
    if (!absence) {
      return res.status(404).json({ error: 'No absence record found for this date' });
    }
    
    res.json(absence);
  } catch (error) {
    next(error);
  }
};

// Get future absences
exports.getFutureAbsences = async (req, res, next) => {
  try {
    const absences = await Absence.findFutureAbsences();
    res.json(absences);
  } catch (error) {
    next(error);
  }
};

// Check core hours compliance status for a student on a specific date
// Returns: { status: 'compliant', 'excused_absent', or 'unexcused_absent' }
exports.getCoreHoursStatus = async (req, res, next) => {
  try {
    const { studentId, date } = req.params;
    const { seasonType = 'build' } = req.query;

    console.log(`[getCoreHoursStatus] Checking status for student ${studentId} on ${date}`);

    // Check if student has an absence record for this date
    const absence = await Absence.findByStudentAndDate(studentId, date);
    
    if (absence) {
      // Student has an absence record
      console.log(`[getCoreHoursStatus] Found absence record with status: ${absence.status}`);
      if (absence.status === 'approved') {
        return res.json({ status: 'excused_absent' });
      } else {
        return res.json({ status: 'unexcused_absent' });
      }
    }

    // No absence record, assume student met requirements
    console.log(`[getCoreHoursStatus] No absence record found, returning compliant`);
    res.json({ status: 'compliant' });
  } catch (error) {
    console.error('[getCoreHoursStatus] Error:', error);
    next(error);
  }
};

// Delete an absence record
exports.deleteAbsence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedBy = req.user?.id;

    if (!deletedBy) {
      return res.status(401).json({ error: 'User ID required for audit logging' });
    }

    const absence = await Absence.findById(id);
    if (!absence) {
      return res.status(404).json({ error: 'Absence not found' });
    }

    await Absence.delete(id, deletedBy);
    res.json({ message: 'Absence deleted successfully' });
  } catch (error) {
    next(error);
  }
};
