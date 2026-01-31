const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Helper function to get current local time as a string (YYYY-MM-DD HH:MM:SS)
function getCurrentLocalTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

class AttendanceSession {
  static async create(userId, checkInTime = null) {
    const id = uuidv4();
    
    // Use provided time or current local time from Node.js server
    const timestamp = checkInTime || getCurrentLocalTime();
    
    const query = `
      INSERT INTO attendance_sessions (id, user_id, check_in_time)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [id, userId, timestamp];
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

  static async checkout(sessionId, checkOutTime = null) {
    // Use provided time or current local time from Node.js server
    const timestamp = checkOutTime || getCurrentLocalTime();
    
    const query = `
      UPDATE attendance_sessions 
      SET check_out_time = $1,
          duration_minutes = EXTRACT(EPOCH FROM ($1::timestamp - check_in_time))::numeric / 60,
          updated_at = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [timestamp, sessionId]);
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
    updates.push(`duration_minutes = EXTRACT(EPOCH FROM (check_out_time - check_in_time))::numeric / 60`);
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
      WHERE a.check_in_time >= ($1::date)::timestamp
        AND a.check_in_time < ($1::date + interval '1 day')::timestamp
      ORDER BY a.check_in_time ASC
    `;
    const result = await db.query(query, [date]);
    return result.rows;
  }

  // Sessions that intersect a UTC time window [startUtc, endUtc)
  static async getSessionsByUtcRange(startUtc, endUtc) {
    const query = `
      SELECT 
        a.*,
        u.alias,
        u.role
      FROM attendance_sessions a
      INNER JOIN users u ON a.user_id = u.id
      WHERE a.check_in_time < $2
        AND (a.check_out_time IS NULL OR a.check_out_time >= $1)
      ORDER BY a.check_in_time ASC
    `;
    const result = await db.query(query, [startUtc, endUtc]);
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

  // Get sessions for a user within a specific time range (for core hours checking)
  static async findByUserAndDateRange(userId, startTime, endTime) {
    const query = `
      SELECT * FROM attendance_sessions 
      WHERE user_id = $1 
        AND check_in_time < $3
        AND (check_out_time IS NULL OR check_out_time > $2)
      ORDER BY check_in_time ASC
    `;
    const result = await db.query(query, [userId, startTime, endTime]);
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
      // Convert to start of day in local time, then to UTC for comparison
      conditions.push(`a.check_in_time >= ($${params.length}::date)::timestamp`);
    }
    if (endDate) {
      params.push(endDate);
      // Convert to end of day in local time, then to UTC for comparison
      conditions.push(`a.check_in_time < ($${params.length}::date + interval '1 day')::timestamp`);
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
        u.first_name,
        u.last_name,
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
      WHERE a.check_in_time >= ($1::date)::timestamp
        AND a.check_in_time < ($2::date + interval '1 day')::timestamp
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

  // Get top students by total attendance hours
  static async getLeaderboard(limit = 10, timezone = 'UTC', includeActiveSession = true) {
    const query = `
      SELECT 
        u.id,
        u.alias,
        u.first_name,
        u.last_name,
        COALESCE(ROUND(SUM(
          CASE
            WHEN a.check_out_time IS NOT NULL THEN COALESCE(a.duration_minutes, 0)
            WHEN $3::boolean = true AND a.check_in_time IS NOT NULL THEN EXTRACT(EPOCH FROM ((CURRENT_TIMESTAMP AT TIME ZONE $2) - a.check_in_time)) / 60
            ELSE 0
          END
        ) / 60.0, 2), 0) as total_hours,
        COUNT(CASE WHEN a.check_out_time IS NOT NULL THEN 1 END) as session_count,
        MAX(a.check_in_time) as last_attendance
      FROM users u
      LEFT JOIN attendance_sessions a ON u.id = a.user_id
      WHERE u.role = 'student'
      GROUP BY u.id, u.alias, u.first_name, u.last_name
      ORDER BY total_hours DESC
      LIMIT $1
    `;
    const result = await db.query(query, [limit, timezone, includeActiveSession]);
    return result.rows;
  }
}

module.exports = AttendanceSession;
