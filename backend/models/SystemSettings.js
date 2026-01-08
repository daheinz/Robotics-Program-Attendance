const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const DEFAULTS = {
  reflectionPrompt: 'Please reflect on what you learned or accomplished today.',
  presenceStartHour: 8,
  presenceEndHour: 24,
};

class SystemSettings {
  static withDefaults(row = {}) {
    return {
      ...row,
      reflection_prompt: row.reflection_prompt ?? DEFAULTS.reflectionPrompt,
      presence_start_hour: row.presence_start_hour ?? DEFAULTS.presenceStartHour,
      presence_end_hour: row.presence_end_hour ?? DEFAULTS.presenceEndHour,
    };
  }

  static async get() {
    const query = 'SELECT * FROM system_settings ORDER BY created_at DESC LIMIT 1';
    const result = await db.query(query);
    
    if (result.rows.length === 0) {
      // Create default settings if none exist
      return this.create(DEFAULTS.reflectionPrompt, DEFAULTS.presenceStartHour, DEFAULTS.presenceEndHour);
    }
    
    return this.withDefaults(result.rows[0]);
  }

  static async create(reflectionPrompt, presenceStartHour = DEFAULTS.presenceStartHour, presenceEndHour = DEFAULTS.presenceEndHour) {
    const id = uuidv4();
    
    const query = `
      INSERT INTO system_settings (id, reflection_prompt, presence_start_hour, presence_end_hour)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [id, reflectionPrompt, presenceStartHour, presenceEndHour];
    const result = await db.query(query, values);
    return this.withDefaults(result.rows[0]);
  }

  static async update({ reflectionPrompt, presenceStartHour, presenceEndHour }) {
    // Get current settings
    const current = await this.get();
    const nextReflectionPrompt = reflectionPrompt ?? current.reflection_prompt;
    const nextStartHour = presenceStartHour ?? current.presence_start_hour;
    const nextEndHour = presenceEndHour ?? current.presence_end_hour;
    
    const query = `
      UPDATE system_settings 
      SET reflection_prompt = $1,
          presence_start_hour = $2,
          presence_end_hour = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await db.query(query, [nextReflectionPrompt, nextStartHour, nextEndHour, current.id]);
    return this.withDefaults(result.rows[0]);
  }
}

module.exports = SystemSettings;
