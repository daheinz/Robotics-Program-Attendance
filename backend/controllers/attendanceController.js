const AttendanceSession = require('../models/AttendanceSession');
const AuditLog = require('../models/AuditLog');
const Reflection = require('../models/Reflection');

class AttendanceController {
  // GET /attendance/range?start_date&end_date&user_ids (comma-separated)
  static async getByRange(req, res) {
    try {
      const { start_date, end_date, user_ids } = req.query;
      const userIds = user_ids ? user_ids.split(',').map(id => id.trim()).filter(Boolean) : [];
      const sessions = await AttendanceSession.getSessionsByUsersAndDateRange(userIds, start_date, end_date);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching attendance range:', error);
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  }

  // GET /attendance/timeline?date=YYYY-MM-DD - Get timeline data (no auth required)
  static async getTimeline(req, res) {
    try {
      const { date, tzOffsetMinutes } = req.query;
      
      if (!date) {
        return res.status(400).json({ error: 'Date parameter is required' });
      }
      // Compute UTC window for the provided local date using client offset
      // tzOffsetMinutes: minutes to add to local to get UTC (JS getTimezoneOffset)
      const offset = Number(tzOffsetMinutes ?? 0);
      const startUtc = new Date(`${date}T00:00:00.000Z`);
      startUtc.setMinutes(startUtc.getMinutes() + offset);
      const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);

      const sessions = await AttendanceSession.getSessionsByUtcRange(
        startUtc.toISOString(),
        endUtc.toISOString()
      );
      
      // Return only non-sensitive data for timeline display
      const timelineData = sessions.map(s => ({
        user_id: s.user_id,
        alias: s.alias,
        role: s.role,
        check_in_time: s.check_in_time,
        check_out_time: s.check_out_time,
      }));
      
      res.json(timelineData);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      res.status(500).json({ error: 'Failed to fetch timeline' });
    }
  }

  // GET /attendance/day?date=YYYY-MM-DD - Get attendance for a specific day
  static async getByDay(req, res) {
    try {
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ error: 'Date parameter is required' });
      }
      
      const sessions = await AttendanceSession.getSessionsByDate(date);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching daily attendance:', error);
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  }

  // GET /attendance/user/:id - Get attendance history for a user
  static async getByUser(req, res) {
    try {
      const { id } = req.params;
      const sessions = await AttendanceSession.getSessionsWithReflections(id);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching user attendance:', error);
      res.status(500).json({ error: 'Failed to fetch user attendance' });
    }
  }

  // PATCH /attendance/:sessionId - Correct an attendance session
  static async correctSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { checkInTime, checkOutTime } = req.body;

      if (!checkInTime && !checkOutTime) {
        return res.status(400).json({ 
          error: 'At least one of checkInTime or checkOutTime is required' 
        });
      }

      const session = await AttendanceSession.update(sessionId, {
        checkInTime,
        checkOutTime,
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Log the correction
      if (req.user) {
        await AuditLog.create({
          actorUserId: req.user.id,
          actionType: 'CORRECT_ATTENDANCE',
          targetUserId: session.user_id,
          details: {
            sessionId,
            checkInTime,
            checkOutTime,
          },
        });
      }

      res.json(session);
    } catch (error) {
      console.error('Error correcting attendance:', error);
      res.status(500).json({ error: 'Failed to correct attendance' });
    }
  }

  // GET /attendance/me/history - Authenticated user's attendance history
  static async getMyHistory(req, res) {
    try {
      const userId = req.user.id;
      const sessions = await AttendanceSession.getSessionsWithReflections(userId);
      res.json({ sessions });
    } catch (error) {
      console.error('Error fetching personal attendance history:', error);
      res.status(500).json({ error: 'Failed to fetch attendance history' });
    }
  }

  // POST /attendance - Manually create an attendance session
  static async createManual(req, res) {
    try {
      const { userId, checkInTime, checkOutTime } = req.body;

      if (!userId || !checkInTime) {
        return res.status(400).json({ 
          error: 'userId and checkInTime are required' 
        });
      }

      // Create session
      const session = await AttendanceSession.create(userId);
      
      // Update with provided times
      const updatedSession = await AttendanceSession.update(session.id, {
        checkInTime,
        checkOutTime,
      });

      // Log the action
      if (req.user) {
        await AuditLog.create({
          actorUserId: req.user.id,
          actionType: 'CREATE_ATTENDANCE',
          targetUserId: userId,
          details: {
            sessionId: session.id,
            checkInTime,
            checkOutTime,
          },
        });
      }

      res.status(201).json(updatedSession);
    } catch (error) {
      console.error('Error creating manual attendance:', error);
      res.status(500).json({ error: 'Failed to create attendance' });
    }
  }

  // GET /attendance/export?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD - Export attendance data
  static async export(req, res) {
    try {
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({ 
          error: 'start_date and end_date parameters are required' 
        });
      }

      const sessions = await AttendanceSession.exportSessions(start_date, end_date);

      // Convert to CSV
      const headers = [
        'First Name',
        'Last Name',
        'Alias',
        'Role',
        'Check In',
        'Check Out',
        'Duration (minutes)',
        'Reflection',
      ];

      const csvRows = [
        headers.join(','),
        ...sessions.map(s => [
          s.first_name,
          s.last_name,
          s.alias,
          s.role,
          s.check_in_time,
          s.check_out_time || '',
          s.duration_minutes || '',
          s.reflection ? `"${s.reflection.replace(/"/g, '""')}"` : '',
        ].join(',')),
      ];

      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_${start_date}_to_${end_date}.csv`);
      res.send(csv);
    } catch (error) {
      console.error('Error exporting attendance:', error);
      res.status(500).json({ error: 'Failed to export attendance' });
    }
  }

  // POST /attendance/check-in - Check in authenticated user
  static async checkIn(req, res) {
    try {
      const userId = req.user.id;

      // Check if user already has an active session
      const activeSession = await AttendanceSession.findActiveSession(userId);
      if (activeSession) {
        return res.status(400).json({ error: 'You are already checked in' });
      }

      // Create new session
      const session = await AttendanceSession.create(userId);

      // Audit log
      await AuditLog.create({
        actorUserId: userId,
        actionType: 'check_in',
        details: { alias: req.user.alias },
      });

      res.status(201).json({ 
        message: 'Successfully checked in',
        session 
      });
    } catch (error) {
      console.error('Error checking in:', error);
      res.status(500).json({ error: 'Failed to check in' });
    }
  }

  // POST /attendance/check-out - Check out authenticated user
  static async checkOut(req, res) {
    try {
      const userId = req.user.id;
      const { reflectionText } = req.body;

      // Find active session for this user
      const session = await AttendanceSession.findActiveSession(userId);

      if (!session) {
        return res.status(400).json({ error: 'No active check-in session found' });
      }

      // Check out the session using DB CURRENT_TIMESTAMP for consistency
      const updatedSession = await AttendanceSession.checkout(session.id);

      // Create reflection if provided
      if (reflectionText) {
        await Reflection.create({
          attendanceId: session.id,
          userId,
          text: reflectionText,
        });
      }

      // Audit log
      await AuditLog.create({
        actorUserId: userId,
        actionType: 'check_out',
        details: { alias: req.user.alias },
      });

      res.json({ 
        message: 'Successfully checked out',
        session: updatedSession 
      });
    } catch (error) {
      console.error('Error checking out:', error);
      res.status(500).json({ error: 'Failed to check out' });
    }
  }

  // GET /attendance/me - Get current user's attendance status
  static async getCurrentUserStatus(req, res) {
    try {
      const userId = req.user.id;

      // Find active session for this user
      const activeSession = await AttendanceSession.findActiveSession(userId);

      res.json({
        checkedIn: !!activeSession,
        session: activeSession || null,
      });
    } catch (error) {
      console.error('Error getting user status:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  }

  // PATCH /attendance/:sessionId/admin - Admin update (times + reflection) with audit reason
  static async adminUpdateSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { checkInTime, checkOutTime, reflectionText, auditReason } = req.body;

      if (!auditReason) {
        return res.status(400).json({ error: 'auditReason is required' });
      }
      if (!checkInTime) {
        return res.status(400).json({ error: 'checkInTime is required' });
      }

      const start = new Date(checkInTime);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      if (checkOutTime) {
        const end = new Date(checkOutTime);
        if (isNaN(end.getTime())) {
          return res.status(400).json({ error: 'Invalid date format' });
        }
        if (end <= start) {
          return res.status(400).json({ error: 'checkOutTime must be after checkInTime' });
        }
        const diffHours = (end - start) / (1000 * 60 * 60);
        if (diffHours > 12) {
          return res.status(400).json({ error: 'Duration cannot exceed 12 hours' });
        }
      }

      const session = await AttendanceSession.update(sessionId, { checkInTime, checkOutTime });
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (reflectionText) {
        await Reflection.upsertByAttendance({ attendanceId: sessionId, userId: session.user_id, text: reflectionText });
      }

      if (req.user) {
        await AuditLog.create({
          actorUserId: req.user.id,
          actionType: 'ADMIN_UPDATE_ATTENDANCE',
          targetUserId: session.user_id,
          details: { sessionId, checkInTime, checkOutTime, reflectionText, auditReason },
        });
      }

      res.json(session);
    } catch (error) {
      console.error('Error updating attendance:', error);
      res.status(500).json({ error: 'Failed to update attendance' });
    }
  }

  // GET /attendance/:sessionId/audit-log - audit history for a session
  static async getAuditLog(req, res) {
    try {
      const { sessionId } = req.params;
      const logs = await AuditLog.findByAttendanceSession(sessionId);
      res.json({ logs });
    } catch (error) {
      console.error('Error fetching attendance audit log:', error);
      res.status(500).json({ error: 'Failed to fetch audit log' });
    }
  }

  // POST /attendance/admin - Create a manual session with audit reason
  static async adminCreate(req, res) {
    try {
      const { userId, checkInTime, checkOutTime, reflectionText, auditReason } = req.body;
      if (!auditReason) {
        return res.status(400).json({ error: 'auditReason is required' });
      }
      if (!userId || !checkInTime) {
        return res.status(400).json({ error: 'userId and checkInTime are required' });
      }
      if (!checkOutTime) {
        return res.status(400).json({ error: 'checkOutTime is required for admin create' });
      }

      const start = new Date(checkInTime);
      const end = new Date(checkOutTime);
      if (end <= start) {
        return res.status(400).json({ error: 'checkOutTime must be after checkInTime' });
      }
      const diffHours = (end - start) / (1000 * 60 * 60);
      if (diffHours > 12) {
        return res.status(400).json({ error: 'Duration cannot exceed 12 hours' });
      }

      const session = await AttendanceSession.create(userId);
      const updatedSession = await AttendanceSession.update(session.id, { checkInTime, checkOutTime });

      if (reflectionText) {
        await Reflection.upsertByAttendance({ attendanceId: session.id, userId, text: reflectionText });
      }

      if (req.user) {
        await AuditLog.create({
          actorUserId: req.user.id,
          actionType: 'ADMIN_CREATE_ATTENDANCE',
          targetUserId: userId,
          details: { sessionId: session.id, checkInTime, checkOutTime, reflectionText, auditReason },
        });
      }

      res.status(201).json(updatedSession);
    } catch (error) {
      console.error('Error creating attendance:', error);
      res.status(500).json({ error: 'Failed to create attendance' });
    }
  }

  // DELETE /attendance/:sessionId - Admin delete with audit reason
  static async adminDelete(req, res) {
    try {
      const { sessionId } = req.params;
      const { auditReason } = req.body;
      if (!auditReason) {
        return res.status(400).json({ error: 'auditReason is required' });
      }

      const session = await AttendanceSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      await AttendanceSession.delete(sessionId);

      if (req.user) {
        await AuditLog.create({
          actorUserId: req.user.id,
          actionType: 'ADMIN_DELETE_ATTENDANCE',
          targetUserId: session.user_id,
          details: { sessionId, auditReason },
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting attendance:', error);
      res.status(500).json({ error: 'Failed to delete attendance' });
    }
  }

  // POST /attendance/user/:userId/quick-checkin - Quick check-in for today (coach/mentor initiated)
  static async quickCheckIn(req, res) {
    try {
      const { userId } = req.params;
      const { checkInTime, auditReason } = req.body;

      if (!checkInTime) {
        return res.status(400).json({ error: 'checkInTime is required' });
      }

      const checkIn = new Date(checkInTime);
      const now = new Date();
      if (checkIn > now) {
        return res.status(400).json({ error: 'Cannot enter a future time' });
      }

      // Check if user already has an active session
      const activeSession = await AttendanceSession.findActiveSession(userId);
      if (activeSession) {
        return res.status(400).json({ error: 'User already has an active session' });
      }

      // Create new session with just check-in time (no checkout)
      const session = await AttendanceSession.create(userId);
      const updatedSession = await AttendanceSession.update(session.id, { checkInTime });

      // Audit log
      if (req.user) {
        await AuditLog.create({
          actorUserId: req.user.id,
          actionType: 'QUICK_CHECK_IN',
          targetUserId: userId,
          details: { sessionId: session.id, checkInTime, reason: auditReason || 'Admin quick check-in' },
        });
      }

      res.status(201).json({
        message: 'User checked in successfully',
        session: updatedSession,
      });
    } catch (error) {
      console.error('Error during quick check-in:', error);
      res.status(500).json({ error: 'Failed to check in user' });
    }
  }

  // GET /attendance/user/:userId/status - Get user's current session status
  static async getUserStatus(req, res) {
    try {
      const { userId } = req.params;

      const session = await AttendanceSession.findActiveSession(userId);
      res.json({
        checkedIn: !!session,
        session: session || null,
      });
    } catch (error) {
      console.error('Error getting user status:', error);
      res.status(500).json({ error: 'Failed to get user status' });
    }
  }

  // POST /attendance/user/:userId/quick-checkout - Quick check-out for today (coach/mentor initiated)
  static async quickCheckOut(req, res) {
    try {
      const { userId } = req.params;
      const { checkOutTime, auditReason } = req.body;

      if (!checkOutTime) {
        return res.status(400).json({ error: 'checkOutTime is required' });
      }

      const checkOut = new Date(checkOutTime);
      const now = new Date();
      if (checkOut > now) {
        return res.status(400).json({ error: 'Cannot enter a future time' });
      }

      // Find active session for this user
      const session = await AttendanceSession.findActiveSession(userId);
      if (!session) {
        return res.status(400).json({ error: 'No active session found for this user' });
      }

      // Update session with checkout time
      const updatedSession = await AttendanceSession.update(session.id, { checkOutTime });

      // Audit log
      if (req.user) {
        await AuditLog.create({
          actorUserId: req.user.id,
          actionType: 'QUICK_CHECK_OUT',
          targetUserId: userId,
          details: { sessionId: session.id, checkOutTime, reason: auditReason || 'Admin quick check-out' },
        });
      }

      res.json({
        message: 'User checked out successfully',
        session: updatedSession,
      });
    } catch (error) {
      console.error('Error during quick check-out:', error);
      res.status(500).json({ error: 'Failed to check out user' });
    }
  }
}

module.exports = AttendanceController;
