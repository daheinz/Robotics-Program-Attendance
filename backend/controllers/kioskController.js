const User = require('../models/User');
const AttendanceSession = require('../models/AttendanceSession');
const Reflection = require('../models/Reflection');
const SystemSettings = require('../models/SystemSettings');

class KioskController {
  // GET /kiosk/users - Get active users for kiosk display
  static async getUsers(req, res) {
    try {
      const users = await User.getActiveUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching kiosk users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  // POST /kiosk/check-in - Check in a user
  static async checkIn(req, res) {
    try {
      const { alias, pin } = req.body;

      if (!alias || !pin) {
        return res.status(400).json({ error: 'Alias and PIN are required' });
      }

      // Find user by alias
      const user = await User.findByAlias(alias);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify PIN
      const isValidPin = await User.verifyPin(user.id, pin);
      if (!isValidPin) {
        return res.status(401).json({ error: 'Invalid PIN' });
      }

      // Check if user already has an active session
      const activeSession = await AttendanceSession.findActiveSession(user.id);
      if (activeSession) {
        return res.status(400).json({ error: 'Already checked in' });
      }

      // For students, verify they have at least one parent contact
      if (user.role === 'student') {
        const hasContacts = await User.hasContacts(user.id);
        if (!hasContacts) {
          return res.status(403).json({ 
            error: 'Cannot check in without at least one parent/guardian contact' 
          });
        }
      }

      // Create attendance session
      const session = await AttendanceSession.create(user.id);

      res.status(201).json({
        message: 'Checked in successfully',
        session: {
          id: session.id,
          userId: session.user_id,
          checkInTime: session.check_in_time,
        },
        user: {
          alias: user.alias,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Error during check-in:', error);
      res.status(500).json({ error: 'Failed to check in' });
    }
  }

  // POST /kiosk/check-out - Check out a user
  static async checkOut(req, res) {
    try {
      const { alias, pin, reflectionText } = req.body;

      if (!alias || !pin) {
        return res.status(400).json({ error: 'Alias and PIN are required' });
      }

      // Find user by alias
      const user = await User.findByAlias(alias);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify PIN
      const isValidPin = await User.verifyPin(user.id, pin);
      if (!isValidPin) {
        return res.status(401).json({ error: 'Invalid PIN' });
      }

      // Find active session
      const activeSession = await AttendanceSession.findActiveSession(user.id);
      if (!activeSession) {
        return res.status(400).json({ error: 'No active check-in found' });
      }

      // For students, reflection is required
      if (user.role === 'student' && !reflectionText) {
        return res.status(400).json({ error: 'Reflection is required for students' });
      }

      // Check out
      const session = await AttendanceSession.checkout(activeSession.id);

      // Create reflection if provided
      let reflection = null;
      if (reflectionText) {
        reflection = await Reflection.create({
          attendanceId: session.id,
          userId: user.id,
          text: reflectionText,
        });
      }

      res.json({
        message: 'Checked out successfully',
        session: {
          id: session.id,
          checkInTime: session.check_in_time,
          checkOutTime: session.check_out_time,
          durationMinutes: session.duration_minutes,
        },
        reflection: reflection ? {
          id: reflection.id,
          text: reflection.text,
        } : null,
      });
    } catch (error) {
      console.error('Error during check-out:', error);
      res.status(500).json({ error: 'Failed to check out' });
    }
  }

  // GET /kiosk/reflection-prompt - Get current reflection prompt
  static async getReflectionPrompt(req, res) {
    try {
      const settings = await SystemSettings.get();
      res.json({ prompt: settings.reflection_prompt });
    } catch (error) {
      console.error('Error fetching reflection prompt:', error);
      res.status(500).json({ error: 'Failed to fetch reflection prompt' });
    }
  }
}

module.exports = KioskController;
