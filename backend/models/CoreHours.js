const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class CoreHours {
  // Create a new core hours entry
  static async create({ dayOfWeek, startTime, endTime, type = 'required', seasonType = 'build', isActive = true }) {
    const id = uuidv4();
    
    const query = `
      INSERT INTO core_hours (id, day_of_week, start_time, end_time, type, season_type, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;
    
    const values = [id, dayOfWeek, startTime, endTime, type, seasonType, isActive];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Get all active core hours for a season
  static async findBySeasonType(seasonType = 'build') {
    const query = `
      SELECT * FROM core_hours 
      WHERE season_type = $1 AND is_active = true 
      ORDER BY day_of_week ASC, start_time ASC
    `;
    
    const result = await db.query(query, [seasonType]);
    return result.rows;
  }

  // Get core hours for a specific day
  static async findByDayAndSeason(dayOfWeek, seasonType = 'build') {
    const query = `
      SELECT * FROM core_hours 
      WHERE day_of_week = $1 AND season_type = $2 AND is_active = true
      ORDER BY start_time ASC
    `;
    
    const result = await db.query(query, [dayOfWeek, seasonType]);
    return result.rows;
  }

  // Get all core hours (active and inactive)
  static async findAll(seasonType = null) {
    let query = 'SELECT * FROM core_hours WHERE is_active = true';
    const values = [];
    
    if (seasonType) {
      values.push(seasonType);
      query += ` AND season_type = $${values.length}`;
    }
    
    query += ' ORDER BY day_of_week ASC, start_time ASC';
    
    const result = await db.query(query, values);
    return result.rows;
  }

  // Update core hours
  static async update(id, { startTime, endTime, type, seasonType, isActive }) {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (startTime !== undefined) {
      fields.push(`start_time = $${paramCount}`);
      values.push(startTime);
      paramCount++;
    }
    if (endTime !== undefined) {
      fields.push(`end_time = $${paramCount}`);
      values.push(endTime);
      paramCount++;
    }
    if (type !== undefined) {
      fields.push(`type = $${paramCount}`);
      values.push(type);
      paramCount++;
    }
    if (seasonType !== undefined) {
      fields.push(`season_type = $${paramCount}`);
      values.push(seasonType);
      paramCount++;
    }
    if (isActive !== undefined) {
      fields.push(`is_active = $${paramCount}`);
      values.push(isActive);
      paramCount++;
    }
    
    fields.push(`updated_at = NOW()`);
    values.push(id);
    
    const query = `UPDATE core_hours SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Delete (soft delete)
  static async delete(id) {
    const query = 'UPDATE core_hours SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = CoreHours;
