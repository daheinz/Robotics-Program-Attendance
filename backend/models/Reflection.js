const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Reflection {
  static async create({ attendanceId, userId, text }) {
    const id = uuidv4();
    
    const query = `
      INSERT INTO reflections (id, attendance_id, user_id, text)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [id, attendanceId, userId, text];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM reflections WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByAttendanceId(attendanceId) {
    const query = 'SELECT * FROM reflections WHERE attendance_id = $1';
    const result = await db.query(query, [attendanceId]);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const query = `
      SELECT r.*, a.check_in_time, a.check_out_time
      FROM reflections r
      INNER JOIN attendance_sessions a ON r.attendance_id = a.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async findAll() {
    const query = `
      SELECT 
        r.*,
        u.alias,
        u.first_name,
        u.last_name,
        u.role,
        a.check_in_time,
        a.check_out_time
      FROM reflections r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN attendance_sessions a ON r.attendance_id = a.id
      ORDER BY r.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = Reflection;
