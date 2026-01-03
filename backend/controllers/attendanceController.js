const AttendanceSession = require('../models/AttendanceSession');
const AuditLog = require('../models/AuditLog');
const Reflection = require('../models/Reflection');

class AttendanceController {
  // GET /attendance/timeline?date=YYYY-MM-DD - Get timeline data (no auth required)
  static async getTimeline(req, res) {
    try {
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ error: 'Date parameter is required' });
      }
      
      const sessions = await AttendanceSession.getSessionsByDate(date);
      
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

      // Check out the session
      const checkOutTime = new Date().toISOString();
      const updatedSession = await AttendanceSession.update(session.id, {
        checkOutTime,
      });

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
}

module.exports = AttendanceController;
