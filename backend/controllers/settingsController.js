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

  // PATCH /settings - Update system settings
  static async update(req, res) {
    try {
      const { reflectionPrompt } = req.body;

      if (!reflectionPrompt) {
        return res.status(400).json({ 
          error: 'reflectionPrompt is required' 
        });
      }

      const settings = await SystemSettings.update(reflectionPrompt);

      // Log the action
      if (req.user) {
        await AuditLog.create({
          actorUserId: req.user.id,
          actionType: 'UPDATE_SETTINGS',
          details: { reflectionPrompt },
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
