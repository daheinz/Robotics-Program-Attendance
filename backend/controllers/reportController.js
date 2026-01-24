const Absence = require('../models/Absence');
const User = require('../models/User');
const AttendanceSession = require('../models/AttendanceSession');
const CoreHours = require('../models/CoreHours');

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
