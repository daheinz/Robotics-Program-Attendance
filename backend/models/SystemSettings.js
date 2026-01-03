const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class SystemSettings {
  static async get() {
    const query = 'SELECT * FROM system_settings ORDER BY created_at DESC LIMIT 1';
    const result = await db.query(query);
    
    if (result.rows.length === 0) {
      // Create default settings if none exist
      return this.create('Please reflect on what you learned or accomplished today.');
    }
    
    return result.rows[0];
  }

  static async create(reflectionPrompt) {
    const id = uuidv4();
    
    const query = `
      INSERT INTO system_settings (id, reflection_prompt)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const values = [id, reflectionPrompt];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async update(reflectionPrompt) {
    // Get current settings
    const current = await this.get();
    
    const query = `
      UPDATE system_settings 
      SET reflection_prompt = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [reflectionPrompt, current.id]);
    return result.rows[0];
  }
}

module.exports = SystemSettings;
