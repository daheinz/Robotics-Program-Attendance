const AttendanceSession = require('../models/AttendanceSession');

class PresenceController {
  // GET /presence/current - Get current presence board
  static async getCurrentPresence(req, res) {
    try {
      const presence = await AttendanceSession.getCurrentPresence();
      
      // Format for display
      const formattedPresence = presence.map(p => ({
        userId: p.id,
        alias: p.alias,
        role: p.role,
        sessionId: p.session_id,
        checkInTime: p.check_in_time,
        minutesOnsite: Math.floor(p.minutes_onsite),
        displayName: p.role === 'mentor' ? `${p.alias} (Mentor)` : 
                     p.role === 'coach' ? `${p.alias} (Coach)` : 
                     p.alias,
      }));
      
      res.json(formattedPresence);
    } catch (error) {
      console.error('Error fetching current presence:', error);
      res.status(500).json({ error: 'Failed to fetch current presence' });
    }
  }
}

module.exports = PresenceController;
