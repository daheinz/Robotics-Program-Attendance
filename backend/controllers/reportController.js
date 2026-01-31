const Absence = require('../models/Absence');
const User = require('../models/User');
const AttendanceSession = require('../models/AttendanceSession');
const CoreHours = require('../models/CoreHours');
const db = require('../config/database');

const formatDateLocal = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildRequiredDates = async (startDate, endDate, seasonType = 'build') => {
  const coreHours = await CoreHours.findBySeasonType(seasonType);
  const requiredDays = new Set(
    coreHours
      .filter((ch) => ch.type === 'required')
      .map((ch) => Number(ch.day_of_week))
  );

  if (requiredDays.size === 0) {
    return [];
  }

  const dates = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (requiredDays.has(d.getDay())) {
      dates.push(formatDateLocal(d));
    }
  }

  return dates;
};

// Helper function to check if student met core hours requirement
const checkCoreHoursCompliance = async (studentId, dateStr, dayOfWeek, seasonType = 'build') => {
  try {
    // Get core hours for this day
    const coreHoursList = await CoreHours.findByDayAndSeason(dayOfWeek, seasonType);
    
    if (coreHoursList.length === 0) {
      return { compliant: true, reason: 'No core hours requirement' };
    }
    
    // Get all attendance sessions for this student on this date
    const attendanceSessions = await AttendanceSession.findByStudentAndDate(studentId, dateStr);
    
    if (!attendanceSessions || attendanceSessions.length === 0) {
      return { compliant: false, reason: 'Not present at all' };
    }
    
    // For each core hours block, check compliance
    for (const coreBlock of coreHoursList) {
      const startTime = coreBlock.start_time;
      const endTime = coreBlock.end_time;
      const blockDuration = calculateMinutes(startTime, endTime);
      
      // Calculate total time present during core block (with gaps)
      const presentMinutes = calculatePresentMinutes(attendanceSessions, startTime, endTime);
      
      // Allow up to 30 minutes of gap time
      const maxAllowedGap = 30;
      const minRequiredPresent = blockDuration - maxAllowedGap;
      
      if (presentMinutes < minRequiredPresent) {
        return { 
          compliant: false, 
          reason: `Only present ${presentMinutes} minutes of ${minRequiredPresent} required` 
        };
      }
    }
    
    return { compliant: true, reason: 'Met core hours requirement' };
  } catch (error) {
    console.error('Error checking compliance:', error);
    return { compliant: null, reason: 'Error checking compliance' };
  }
};

// Helper function to calculate minutes between two times
const calculateMinutes = (startTime, endTime) => {
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  return (end - start) / (1000 * 60);
};

// Helper function to calculate present minutes during a time block
const calculatePresentMinutes = (attendanceSessions, blockStart, blockEnd) => {
  let totalMinutes = 0;
  const blockStartDate = new Date(`1970-01-01T${blockStart}`);
  const blockEndDate = new Date(`1970-01-01T${blockEnd}`);
  
  attendanceSessions.forEach(session => {
    if (!session.check_in_time || !session.check_out_time) return;
    
    const checkInTime = new Date(`1970-01-01T${session.check_in_time.substring(11, 19)}`);
    const checkOutTime = new Date(`1970-01-01T${session.check_out_time.substring(11, 19)}`);
    
    // Calculate overlap with block
    const overlapStart = new Date(Math.max(checkInTime.getTime(), blockStartDate.getTime()));
    const overlapEnd = new Date(Math.min(checkOutTime.getTime(), blockEndDate.getTime()));
    
    if (overlapStart < overlapEnd) {
      totalMinutes += (overlapEnd - overlapStart) / (1000 * 60);
    }
  });
  
  return totalMinutes;
};

// Generate attendance report CSV
exports.getAttendanceReportCSV = async (req, res, next) => {
  try {
    const { startDate, endDate, seasonType = 'build' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }
    
    // Get all absences in range
    const absences = await Absence.findForReport(startDate, endDate, seasonType);
    
    // Group by student
    const byStudent = {};
    absences.forEach(absence => {
      if (!byStudent[absence.student_id]) {
        byStudent[absence.student_id] = {
          alias: absence.student_alias,
          firstName: absence.first_name,
          lastName: absence.last_name,
          records: []
        };
      }
      byStudent[absence.student_id].records.push(absence);
    });
    
    // Generate CSV
    let csv = 'Student Name,Date,Status\n';
    
    for (const studentId in byStudent) {
      const student = byStudent[studentId];
      student.records.forEach(record => {
        const status = record.status === 'approved' ? 'Approved Absent' : 'Unapproved Absent';
        csv += `"${student.firstName} ${student.lastName}",${record.absence_date},"${status}"\n`;
      });
    }
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${startDate}_to_${endDate}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

// Generate detailed report with audit logs
exports.getDetailedAuditReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }
    
    const records = await Absence.findForDetailedReport(startDate, endDate);
    
    // Generate text report
    let report = `=== ABSENCE AUDIT REPORT ===\n`;
    report += `Report Period: ${startDate} to ${endDate}\n`;
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `\n${'='.repeat(80)}\n\n`;
    
    for (const record of records) {
      report += `Student: ${record.first_name} ${record.last_name} (${record.student_alias})\n`;
      report += `Date: ${record.absence_date}\n`;
      report += `Status: ${record.status === 'approved' ? 'APPROVED' : 'UNAPPROVED'}\n`;
      report += `Notes: ${record.notes || 'None'}\n`;
      report += `Approved By: ${record.approved_by || 'Not approved'}\n`;
      
      if (record.audit_logs && record.audit_logs.length > 0) {
        report += `\nAudit Log:\n`;
        report += `${'─'.repeat(60)}\n`;
        record.audit_logs.forEach((log, idx) => {
          report += `  [${idx + 1}] ${log.action.toUpperCase()} by ${log.user_alias} on ${log.created_at}\n`;
          if (log.changes) {
            const changes = JSON.parse(log.changes);
            Object.keys(changes).forEach(key => {
              if (changes[key].from !== undefined) {
                report += `      ${key}: ${changes[key].from} → ${changes[key].to}\n`;
              } else {
                report += `      ${key}: ${changes[key]}\n`;
              }
            });
          }
        });
      }
      
      report += `\n${'─'.repeat(80)}\n\n`;
    }
    
    // Set response headers for text download
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="audit_report_${startDate}_to_${endDate}.txt"`);
    res.send(report);
  } catch (error) {
    next(error);
  }
};

// Get attendance summary for web display
exports.getAttendanceSummary = async (req, res, next) => {
  try {
    const { startDate, endDate, seasonType = 'build' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }
    
    const absences = await Absence.findForReport(startDate, endDate, seasonType);
    
    // Group by student
    const summary = {};
    absences.forEach(absence => {
      if (!summary[absence.student_id]) {
        summary[absence.student_id] = {
          alias: absence.student_alias,
          firstName: absence.first_name,
          lastName: absence.last_name,
          approved: 0,
          unapproved: 0,
          records: []
        };
      }
      
      if (absence.status === 'approved') {
        summary[absence.student_id].approved++;
      } else {
        summary[absence.student_id].unapproved++;
      }
      
      summary[absence.student_id].records.push({
        date: absence.absence_date,
        status: absence.status,
        notes: absence.notes
      });
    });
    
    res.json({
      startDate,
      endDate,
      seasonType,
      students: Object.values(summary)
    });
  } catch (error) {
    next(error);
  }
};

// Get future absences summary
exports.getFutureAbsencesSummary = async (req, res, next) => {
  try {
    const absences = await Absence.findFutureAbsences();
    
    // Group by student
    const summary = {};
    absences.forEach(absence => {
      if (!summary[absence.student_id]) {
        summary[absence.student_id] = {
          alias: absence.student_alias,
          firstName: absence.first_name,
          lastName: absence.last_name,
          absences: []
        };
      }
      
      summary[absence.student_id].absences.push({
        date: absence.absence_date,
        status: absence.status,
        notes: absence.notes,
        approvedBy: absence.approved_by
      });
    });
    
    res.json({
      generatedAt: new Date().toISOString(),
      students: Object.values(summary)
    });
  } catch (error) {
    next(error);
  }
};

// Attendance sessions report (students or mentors)
exports.getAttendanceSessionsReport = async (req, res, next) => {
  try {
    const { startDate, endDate, role, userId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    let userIds = [];
    let user = null;

    if (userId) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      userIds = [userId];
    } else if (role) {
      let roles = [];
      if (role === 'mentor-coach') {
        roles = ['mentor', 'coach'];
      } else {
        roles = [role];
      }
      const users = await User.findByRoles(roles);
      userIds = users.map((u) => u.id);
    }

    const sessions = await AttendanceSession.getSessionsByUsersAndDateRange(userIds, startDate, endDate);

    res.json({
      startDate,
      endDate,
      role: role || null,
      user: user
        ? { id: user.id, alias: user.alias, firstName: user.first_name, lastName: user.last_name, role: user.role }
        : null,
      sessions,
    });
  } catch (error) {
    next(error);
  }
};

// Absences report (all students or single student)
exports.getAbsencesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, seasonType = 'build', userId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    let absences = [];
    let user = null;

    if (userId) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      absences = await Absence.findForStudentReport(userId, startDate, endDate, seasonType);
    } else {
      absences = await Absence.findForReport(startDate, endDate, seasonType);
    }

    res.json({
      startDate,
      endDate,
      seasonType,
      user: user
        ? { id: user.id, alias: user.alias, firstName: user.first_name, lastName: user.last_name, role: user.role }
        : null,
      absences,
    });
  } catch (error) {
    next(error);
  }
};

// Student totals report (durations + absences)
exports.getStudentTotalsReport = async (req, res, next) => {
  try {
    const { startDate, endDate, seasonType = 'build' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const query = `
      SELECT
        u.id,
        u.alias,
        u.first_name,
        u.last_name,
        COALESCE(att.total_minutes, 0) AS total_minutes,
        COALESCE(abs.excused_count, 0) AS excused_count,
        COALESCE(abs.unexcused_count, 0) AS unexcused_count
      FROM users u
      LEFT JOIN (
        SELECT
          a.user_id,
          SUM(
            CASE
              WHEN a.check_out_time IS NOT NULL THEN COALESCE(a.duration_minutes, 0)
              WHEN a.check_in_time IS NOT NULL THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.check_in_time)) / 60
              ELSE 0
            END
          ) AS total_minutes
        FROM attendance_sessions a
        WHERE a.check_in_time >= ($1::date)::timestamp
          AND a.check_in_time < ($2::date + interval '1 day')::timestamp
        GROUP BY a.user_id
      ) att ON att.user_id = u.id
      LEFT JOIN (
        SELECT
          a.student_id,
          SUM(CASE WHEN a.status = 'approved' THEN 1 ELSE 0 END) AS excused_count,
          SUM(CASE WHEN a.status = 'unapproved' THEN 1 ELSE 0 END) AS unexcused_count
        FROM absences a
        WHERE a.absence_date BETWEEN $1 AND $2
          AND ($3::text IS NULL OR a.season_type = $3)
        GROUP BY a.student_id
      ) abs ON abs.student_id = u.id
      WHERE u.is_active = true AND u.role = 'student'
      ORDER BY u.alias ASC
    `;

    const params = [startDate, endDate, seasonType || null];
    const result = await db.query(query, params);

    res.json({
      startDate,
      endDate,
      seasonType,
      students: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Valid sessions report (required days with no absence records)
exports.getValidSessionsReport = async (req, res, next) => {
  try {
    const { startDate, endDate, seasonType = 'build' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const requiredDates = await buildRequiredDates(startDate, endDate, seasonType);
    const requiredCount = requiredDates.length;

    if (requiredCount === 0) {
      const students = await User.findAll({ role: 'student' });
      const mapped = students.map((student) => ({
        id: student.id,
        alias: student.alias,
        first_name: student.first_name,
        last_name: student.last_name,
        required_count: 0,
        absences_count: 0,
        unexcused_count: 0,
        approved_count: 0,
        valid_sessions: 0,
      }));

      return res.json({
        startDate,
        endDate,
        seasonType,
        requiredCount,
        students: mapped,
      });
    }

    const query = `
      SELECT
        u.id,
        u.alias,
        u.first_name,
        u.last_name,
        COALESCE(abs.absences_count, 0) AS absences_count,
        COALESCE(abs.unexcused_count, 0) AS unexcused_count,
        COALESCE(abs.approved_count, 0) AS approved_count
      FROM users u
      LEFT JOIN (
        SELECT
          a.student_id,
          COUNT(*) AS absences_count,
          SUM(CASE WHEN a.status = 'unapproved' THEN 1 ELSE 0 END) AS unexcused_count,
          SUM(CASE WHEN a.status = 'approved' THEN 1 ELSE 0 END) AS approved_count
        FROM absences a
        WHERE a.absence_date = ANY($1::date[])
          AND ($2::text IS NULL OR a.season_type = $2)
        GROUP BY a.student_id
      ) abs ON abs.student_id = u.id
      WHERE u.is_active = true AND u.role = 'student'
      ORDER BY u.alias ASC
    `;

    const params = [requiredDates, seasonType || null];
    const result = await db.query(query, params);

    const students = result.rows.map((student) => {
      const absencesCount = Number(student.absences_count || 0);
      return {
        ...student,
        required_count: requiredCount,
        valid_sessions: Math.max(requiredCount - absencesCount, 0),
      };
    });

    res.json({
      startDate,
      endDate,
      seasonType,
      requiredCount,
      students,
    });
  } catch (error) {
    next(error);
  }
};
