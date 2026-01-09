const SystemSettings = require('../models/SystemSettings');
const AuditLog = require('../models/AuditLog');

class SettingsController {
  // GET /settings - Get system settings
  static async get(req, res) {
    try {
      const settings = await SystemSettings.get();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  // GET /settings/public - Get limited system settings without auth (read-only)
  static async getPublic(req, res) {
    try {
      const settings = await SystemSettings.get();
      res.json({
        presence_start_hour: settings.presence_start_hour,
        presence_end_hour: settings.presence_end_hour,
        color_student_checked_in: settings.color_student_checked_in,
        color_mentor_checked_in: settings.color_mentor_checked_in,
        color_not_checked_in: settings.color_not_checked_in,
        color_past_session: settings.color_past_session,
        color_active_session: settings.color_active_session,
        color_current_time: settings.color_current_time,
      });
    } catch (error) {
      console.error('Error fetching public settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  // PATCH /settings - Update system settings
  static async update(req, res) {
    try {
      const { 
        reflectionPrompt, 
        presenceStartHour, 
        presenceEndHour,
        colorStudentCheckedIn,
        colorMentorCheckedIn,
        colorNotCheckedIn,
        colorPastSession,
        colorActiveSession,
        colorCurrentTime
      } = req.body;

      // Validate window with current values to provide clearer error messages
      const current = await SystemSettings.get();
      const nextStart = presenceStartHour ?? current.presence_start_hour;
      const nextEnd = presenceEndHour ?? current.presence_end_hour;
      if (nextStart >= nextEnd) {
        return res.status(400).json({ error: 'presenceStartHour must be less than presenceEndHour' });
      }

      const settings = await SystemSettings.update({
        reflectionPrompt,
        presenceStartHour,
        presenceEndHour,
        colorStudentCheckedIn,
        colorMentorCheckedIn,
        colorNotCheckedIn,
        colorPastSession,
        colorActiveSession,
        colorCurrentTime,
      });

      // Log the action
      if (req.user) {
        await AuditLog.create({
          actorUserId: req.user.id,
          actionType: 'UPDATE_SETTINGS',
          details: { 
            reflectionPrompt, 
            presenceStartHour, 
            presenceEndHour,
            colorStudentCheckedIn,
            colorMentorCheckedIn,
            colorNotCheckedIn,
            colorPastSession,
            colorActiveSession,
            colorCurrentTime
          },
        });
      }

      res.json(settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
}

module.exports = SettingsController;
