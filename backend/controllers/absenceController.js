const Absence = require('../models/Absence');
const User = require('../models/User');
const AttendanceSession = require('../models/AttendanceSession');
const CoreHours = require('../models/CoreHours');

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

// Authenticated student: get own absences (defaults to last 90 days if no range provided)
exports.getMyAbsences = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const today = new Date();
    const endDate = req.query.endDate || today.toISOString().slice(0, 10);
    const startDate = req.query.startDate || new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const absences = await Absence.findByStudentAndDateRange(studentId, startDate, endDate);
    res.json({ absences, startDate, endDate });
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
    const { status, notes, approvedBy, auditReason } = req.body;
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
      updatedBy,
      auditReason
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
/**
 * Parse time string "HH:MM:SS" to { hours, minutes, seconds }
 */
function parseTimeString(timeStr) {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return { hours, minutes, seconds };
}

// Compute total checked-in minutes overlapping the core hours window (clamped to now for active sessions)
function computeCheckedInMinutes(sessions, windowStart, windowEnd, now) {
  let total = 0;
  for (const session of sessions || []) {
    let sessionStart = new Date(session.check_in_time);
    let sessionEnd = session.check_out_time ? new Date(session.check_out_time) : now;

    // Clamp to core hours window
    if (sessionStart < windowStart) sessionStart = new Date(windowStart);
    if (sessionEnd > windowEnd) sessionEnd = new Date(windowEnd);

    if (sessionEnd > sessionStart) {
      total += (sessionEnd - sessionStart) / (1000 * 60);
    }
  }
  return total;
}

exports.getCoreHoursStatus = async (req, res, next) => {
  try {
    const { studentId, date } = req.params;
    const { seasonType = 'build' } = req.query;
    const now = new Date();

    console.log(`[getCoreHoursStatus] Checking status for student ${studentId} on ${date}`);

    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }

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

    // No absence record, check attendance sessions for the day
    // Handle timezone properly: date is in local timezone, need to convert to UTC range
    // Create start of day in local timezone, then convert to UTC
    const [year, month, day] = date.split('-').map(Number);
    const localStartOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const localEndOfDay = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
    
    // Convert to UTC by accounting for local offset
    const offsetMs = localStartOfDay.getTime() - new Date(localStartOfDay).getTime();
    const startOfDay = new Date(localStartOfDay.getTime() + offsetMs);
    const endOfDay = new Date(localEndOfDay.getTime() + offsetMs);
    
    console.log(`[getCoreHoursStatus] Checking sessions between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);

    const sessions = await AttendanceSession.findByUserAndDateRange(
      studentId,
      startOfDay,
      endOfDay
    );

    // Apply presence timeline rules:
    // Get today's day of week for this date
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();

    // Get core hours for today
    const todaysCoreHours = await CoreHours.findByDayAndSeason(dayOfWeek, seasonType);

    if (!todaysCoreHours || todaysCoreHours.length === 0) {
      console.log('[getCoreHoursStatus] No core hours configured for this day');
      return res.json({ status: null });
    }

    // Check each core hours session
    for (const coreHours of todaysCoreHours) {
      const startTime = parseTimeString(coreHours.start_time);
      const endTime = parseTimeString(coreHours.end_time);

      // Build start and end datetimes for today
      let sessionStart = new Date(year, month - 1, day, startTime.hours, startTime.minutes, startTime.seconds, 0);
      let sessionEnd = new Date(year, month - 1, day, endTime.hours, endTime.minutes, endTime.seconds, 0);

      // Handle day boundary: if end time is before start time, it wrapped to next day
      if (sessionEnd < sessionStart) {
        sessionEnd.setDate(sessionEnd.getDate() + 1);
      }

      console.log(`[getCoreHoursStatus] Checking core hours: ${coreHours.start_time} - ${coreHours.end_time}`);
      console.log(`[getCoreHoursStatus] Session times: ${sessionStart.toISOString()} - ${sessionEnd.toISOString()}`);
      console.log(`[getCoreHoursStatus] Current time: ${now.toISOString()}`);

      const ensureUnexcusedRecord = async (noteReason) => {
        const coreHoursWindow = `${coreHours.start_time} - ${coreHours.end_time}`;
        const notes = `System Generated - ${noteReason}. Core hours for this date were ${coreHoursWindow} and you were not present during that time frame.`;
        try {
          await Absence.create({
            studentId,
            absenceDate: date,
            dayOfWeek,
            status: 'unapproved',
            notes,
            seasonType,
            createdBy: null,
          });
        } catch (err) {
          if (err.code !== '23505') {
            throw err;
          }
        }
      };

      // State 1: Session hasn't started yet → NEUTRAL (no indicator)
      if (now < sessionStart) {
        console.log('[getCoreHoursStatus] Session not started yet; returning neutral state (no indicator)');
        return res.json({ status: null });
      }

      // State 2: Session has ended → evaluate total accrued time
      if (now >= sessionEnd) {
        const accruedMinutes = computeCheckedInMinutes(sessions, sessionStart, sessionEnd, now);
        const totalMinutes = (sessionEnd - sessionStart) / (1000 * 60);
        const requiredMinutes = Math.max(0, totalMinutes - 30); // 30-minute grace overall
        console.log(`[getCoreHoursStatus] Session ended. Accrued ${accruedMinutes.toFixed(2)} min, required ${requiredMinutes.toFixed(2)} min`);
        
        if (accruedMinutes >= requiredMinutes) {
          console.log('[getCoreHoursStatus] Requirement met; returning compliant');
          return res.json({ status: 'compliant' });
        } else {
          console.log('[getCoreHoursStatus] Requirement not met → unexcused_absent');
          await ensureUnexcusedRecord('Failed to meet criteria for core hours');
          return res.json({ status: 'unexcused_absent' });
        }
      }

      // State 3: Session is in progress
      const graceWindowMs = 30 * 60 * 1000; // 30 minutes in milliseconds
      const graceWindowEnd = new Date(sessionStart.getTime() + graceWindowMs);

      // Within grace window → always neutral
      if (now < graceWindowEnd) {
        console.log(`[getCoreHoursStatus] Within grace window (start+30); returning neutral. Grace ends at ${graceWindowEnd.toISOString()}`);
        return res.json({ status: null });
      }

      // Past grace window, session still in progress
      // If student checked in after grace window, mark unexcused
      // If student has not checked in at all, mark unexcused
      if (sessions && sessions.length > 0) {
        const earliestCheckIn = sessions
          .map(s => new Date(s.check_in_time))
          .sort((a, b) => a - b)[0];
        if (earliestCheckIn && earliestCheckIn > graceWindowEnd) {
          console.log('[getCoreHoursStatus] Past grace window with late check-in; marking unexcused_absent');
          await ensureUnexcusedRecord('Checked in more than 30 minutes after core hours start');
          return res.json({ status: 'unexcused_absent' });
        }
        console.log('[getCoreHoursStatus] Past grace window but student checked in on time; returning neutral until session ends');
        return res.json({ status: null });
      }

      console.log('[getCoreHoursStatus] Past grace window with no check-in; marking unexcused_absent');
      await ensureUnexcusedRecord('No check-in during core hours');
      return res.json({ status: 'unexcused_absent' });
    }

    // Fallback: if no core hours matched or other edge case
    console.log('[getCoreHoursStatus] No matching core hours; returning neutral');
    return res.json({ status: null });
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
