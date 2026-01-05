const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class AttendanceSession {
  static async create(userId) {
    const id = uuidv4();
    
    const query = `
      INSERT INTO attendance_sessions (id, user_id, check_in_time)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [id, userId];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM attendance_sessions WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findActiveSession(userId) {
    const query = `
      SELECT * FROM attendance_sessions 
      WHERE user_id = $1 AND check_out_time IS NULL
      ORDER BY check_in_time DESC
      LIMIT 1
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  static async checkout(sessionId) {
    const query = `
      UPDATE attendance_sessions 
      SET check_out_time = CURRENT_TIMESTAMP,
          duration_minutes = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - check_in_time)) / 60,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [sessionId]);
    return result.rows[0];
  }

  static async update(sessionId, { checkInTime, checkOutTime }) {
    const updates = [];
    const values = [];
    
    if (checkInTime) {
      values.push(checkInTime);
      updates.push(`check_in_time = $${values.length}`);
    }
    
    if (checkOutTime) {
      values.push(checkOutTime);
      updates.push(`check_out_time = $${values.length}`);
    }
    
    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Recalculate duration
    updates.push(`duration_minutes = EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 60`);
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    values.push(sessionId);
    const query = `
      UPDATE attendance_sessions 
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async getCurrentPresence() {
    const query = `
      SELECT 
        u.id,
        u.alias,
        u.role,
        a.id as session_id,
        a.check_in_time,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.check_in_time)) / 60 as minutes_onsite
      FROM users u
      INNER JOIN attendance_sessions a ON u.id = a.user_id
      WHERE a.check_out_time IS NULL
      ORDER BY a.check_in_time ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async getActiveSessions() {
    const query = `
      SELECT * FROM attendance_sessions 
      WHERE check_out_time IS NULL
      ORDER BY check_in_time ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async getSessionsByDate(date) {
    const query = `
      SELECT 
        a.*,
        u.alias,
        u.first_name,
        u.last_name,
        u.role
      FROM attendance_sessions a
      INNER JOIN users u ON a.user_id = u.id
      WHERE DATE(a.check_in_time) = $1
      ORDER BY a.check_in_time ASC
    `;
    const result = await db.query(query, [date]);
    return result.rows;
  }

  static async getSessionsByUser(userId) {
    const query = `
      SELECT * FROM attendance_sessions 
      WHERE user_id = $1
      ORDER BY check_in_time DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async getSessionsWithReflections(userId) {
    const query = `
      SELECT 
        a.*,
        r.text as reflection_text,
        r.created_at as reflection_created_at
      FROM attendance_sessions a
      LEFT JOIN reflections r ON a.id = r.attendance_id
      WHERE a.user_id = $1
      ORDER BY a.check_in_time DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async getSessionsByUsersAndDateRange(userIds, startDate, endDate) {
    const params = [];
    const conditions = [];

    if (startDate) {
      params.push(startDate);
      conditions.push(`DATE(a.check_in_time) >= $${params.length}`);
    }
    if (endDate) {
      params.push(endDate);
      conditions.push(`DATE(a.check_in_time) <= $${params.length}`);
    }
    if (userIds && userIds.length > 0) {
      params.push(userIds);
      conditions.push(`a.user_id = ANY($${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        a.*, 
        u.alias, 
        u.role, 
        r.text AS reflection_text
      FROM attendance_sessions a
      INNER JOIN users u ON a.user_id = u.id
      LEFT JOIN reflections r ON a.id = r.attendance_id
      ${whereClause}
      ORDER BY a.check_in_time ASC
    `;

    const result = await db.query(query, params);
    return result.rows;
  }

  static async exportSessions(startDate, endDate) {
    const query = `
      SELECT 
        u.first_name,
        u.last_name,
        u.alias,
        u.role,
        a.check_in_time,
        a.check_out_time,
        a.duration_minutes,
        r.text as reflection
      FROM attendance_sessions a
      INNER JOIN users u ON a.user_id = u.id
      LEFT JOIN reflections r ON a.id = r.attendance_id
      WHERE DATE(a.check_in_time) BETWEEN $1 AND $2
      ORDER BY a.check_in_time ASC
    `;
    const result = await db.query(query, [startDate, endDate]);
    return result.rows;
  }

  static async delete(sessionId) {
    const query = 'DELETE FROM attendance_sessions WHERE id = $1';
    await db.query(query, [sessionId]);
    return true;
  }
}

module.exports = AttendanceSession;
