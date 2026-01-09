const cron = require('node-cron');
const CoreHours = require('../models/CoreHours');
const Absence = require('../models/Absence');
const User = require('../models/User');
const AttendanceSession = require('../models/AttendanceSession');

/**
 * Core Hours Compliance Checker
 * Runs every 15 minutes to check if students met core hours requirements
 * If a core hours session just ended, checks all students and creates absence records
 * for those who didn't meet the criteria (missing more than 30 minutes)
 */

// Store the last checked time to avoid duplicate checks
let lastCheckedTime = new Date();

async function checkCoreHoursCompliance() {
  try {
    const now = new Date();
    
    // Get all active core hours for the current season
    const coreHoursSessions = await CoreHours.findAll('build');
    
    if (!coreHoursSessions || coreHoursSessions.length === 0) {
      return;
    }

    // Get today's day of week (0 = Sunday, 6 = Saturday)
    const today = now.getDay();

    // Find core hours that match today's day of week
    const todaysCoreHours = coreHoursSessions.filter(ch => parseInt(ch.day_of_week) === today);

    if (todaysCoreHours.length === 0) {
      return;
    }

    // For each core hours session, check if it ended in the last 15 minutes
    for (const coreHours of todaysCoreHours) {
      const endTime = parseTimeString(coreHours.end_time);
      const endDateTime = getEndDateTimeForToday(endTime, now);
      
      // Check if this session ended in the last 15 minutes
      const timeDiffMinutes = (now - endDateTime) / (1000 * 60);
      
      // If session ended between 0 and 15 minutes ago, process it
      if (timeDiffMinutes >= 0 && timeDiffMinutes < 15) {
        await processCoreHoursSession(coreHours, now);
      }
    }
  } catch (error) {
    console.error('Error in checkCoreHoursCompliance:', error);
  }
}

/**
 * Parse time string "HH:MM:SS" to { hours, minutes, seconds }
 */
function parseTimeString(timeStr) {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return { hours, minutes, seconds };
}

/**
 * Get the end date/time for today, handling midnight edge case
 * If core hours end at 11:59 PM and now is 12:14 AM, return yesterday's end time
 */
function getEndDateTimeForToday(endTime, now) {
  const endDateTime = new Date(now);
  endDateTime.setHours(endTime.hours, endTime.minutes, endTime.seconds, 0);
  
  // If the end time hasn't occurred yet today, use yesterday's end time
  if (endDateTime > now) {
    endDateTime.setDate(endDateTime.getDate() - 1);
  }
  
  return endDateTime;
}

/**
 * Get the absence date for the session
 * If core hours end time was before current time (wrapped to yesterday), use yesterday's date
 * Otherwise use today's date
 */
function getAbsenceDateForSession(endTime, now) {
  const endDateTime = getEndDateTimeForToday(endTime, now);
  
  // The absence date is the date when the session ended
  const absenceDate = new Date(endDateTime);
  return absenceDate.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Process a specific core hours session
 * Check all students and create absence records for those who didn't meet requirements
 */
async function processCoreHoursSession(coreHours, now) {
  try {
    const startTime = parseTimeString(coreHours.start_time);
    const endTime = parseTimeString(coreHours.end_time);
    
    // Build start and end datetimes
    let startDateTime = new Date(now);
    startDateTime.setHours(startTime.hours, startTime.minutes, startTime.seconds, 0);
    
    let endDateTime = new Date(now);
    endDateTime.setHours(endTime.hours, endTime.minutes, endTime.seconds, 0);
    
    // Handle day boundary: if end time is before start time, it wrapped to next day
    // But we need to handle if we're past midnight
    if (endDateTime < startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }
    
    // Handle if we're past midnight and the session was yesterday
    if (endDateTime > now) {
      startDateTime.setDate(startDateTime.getDate() - 1);
      endDateTime.setDate(endDateTime.getDate() - 1);
    }
    
    const absenceDate = startDateTime.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Calculate required attendance time in minutes
    // Total duration - 30 minute grace period
    const totalMinutes = (endDateTime - startDateTime) / (1000 * 60);
    const requiredMinutes = totalMinutes - 30;
    
    // Get all students
    const students = await User.findAll({ role: 'student' });
    
    for (const student of students) {
      // Check if student already has an absence record for this date
      const existingAbsence = await Absence.findByStudentAndDate(student.id, absenceDate);
      
      if (existingAbsence) {
        // Skip this student, already has a record
        continue;
      }
      
      // Get all attendance sessions for this student on this date
      const attendanceSessions = await AttendanceSession.findByUserAndDateRange(
        student.id,
        startDateTime,
        endDateTime
      );
      
      // Calculate total checked-in time (only within core hours window)
      let totalCheckedInMinutes = 0;
      
      for (const session of attendanceSessions) {
        // Get actual check-in and check-out times
        let sessionStart = new Date(session.check_in_time);
        let sessionEnd = session.check_out_time ? new Date(session.check_out_time) : endDateTime;
        
        // Clamp session times to core hours window
        // Don't count time before core hours start
        if (sessionStart < startDateTime) {
          sessionStart = new Date(startDateTime);
        }
        
        // Don't count time after core hours end
        if (sessionEnd > endDateTime) {
          sessionEnd = new Date(endDateTime);
        }
        
        // Only count if there's valid time within the core hours window
        if (sessionEnd > sessionStart) {
          const sessionDuration = (sessionEnd - sessionStart) / (1000 * 60);
          totalCheckedInMinutes += sessionDuration;
        }
      }
      
      // Check if student met the requirement
      if (totalCheckedInMinutes < requiredMinutes) {
        // Create an absence record
        const shortfallMinutes = (requiredMinutes - totalCheckedInMinutes).toFixed(2);
        console.log(`[CoreHoursChecker] ❌ ${student.alias} (ID: ${student.id}): FAILED - Only ${totalCheckedInMinutes.toFixed(2)} of ${requiredMinutes.toFixed(2)} minutes (short by ${shortfallMinutes} minutes)`);
        
        try {
          const absenceRecord = await Absence.create({
            studentId: student.id,
            absenceDate: absenceDate,
            dayOfWeek: coreHours.day_of_week,
            status: 'unapproved',
            notes: 'System Generated - Failed to meet criteria for core hours.',
            seasonType: coreHours.season_type,
            createdBy: null
          });
          
          console.log(`[CoreHoursChecker] ✓ GENERATED ABSENCE RECORD - ${student.alias} on ${absenceDate} (Record ID: ${absenceRecord.id})`);
        } catch (err) {
          if (err.code === '23505') {
            console.log(`[CoreHoursChecker] ⚠ Absence record already exists for ${student.alias} on ${absenceDate}`);
          } else {
            throw err;
          }
        }
      } else {
        console.log(`[CoreHoursChecker] ✓ ${student.alias} (ID: ${student.id}): PASSED - ${totalCheckedInMinutes.toFixed(2)} of ${requiredMinutes.toFixed(2)} minutes`);
      }
    }
  } catch (error) {
    console.error('Error in processCoreHoursSession:', error);
  }
}

/**
 * Start the core hours compliance checker
 * Runs every 15 minutes
 */
function startCoreHoursChecker() {
  // Run every 15 minutes
  const task = cron.schedule('*/15 * * * *', async () => {
    console.log(`[${new Date().toISOString()}] Running core hours compliance check...`);
    await checkCoreHoursCompliance();
  });
  
  console.log('✓ Core hours compliance checker scheduled (every 15 minutes)');
  return task;
}

/**
 * Test function to check compliance for today's core hours
 * Ignores the 15-minute window requirement - useful for testing
 */
async function testCoreHoursComplianceForToday() {
  try {
    const now = new Date();
    console.log(`[TEST] Running core hours compliance check for today (${now.toISOString()})...`);
    
    // Get all active core hours for the current season
    const coreHoursSessions = await CoreHours.findAll('build');
    
    if (!coreHoursSessions || coreHoursSessions.length === 0) {
      console.log('[TEST] No core hours sessions found');
      return;
    }

    // Get today's day of week (0 = Sunday, 6 = Saturday)
    const today = now.getDay();
    console.log(`[TEST] Today is day ${today}`);

    // Find core hours that match today's day of week
    const todaysCoreHours = coreHoursSessions.filter(ch => parseInt(ch.day_of_week) === today);

    if (todaysCoreHours.length === 0) {
      console.log(`[TEST] No core hours configured for day ${today}`);
      return;
    }

    console.log(`[TEST] Found ${todaysCoreHours.length} core hours session(s) for today`);

    // Process all of today's core hours sessions (ignoring time window)
    for (const coreHours of todaysCoreHours) {
      console.log(`[TEST] Processing core hours: ${coreHours.start_time} - ${coreHours.end_time}`);
      await processCoreHoursSession(coreHours, now);
    }
    
    console.log('[TEST] Core hours compliance check completed');
  } catch (error) {
    console.error('[TEST] Error in testCoreHoursComplianceForToday:', error);
    throw error;
  }
}

module.exports = { startCoreHoursChecker, checkCoreHoursCompliance, testCoreHoursComplianceForToday };
