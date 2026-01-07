const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Absence {
  // Create a new absence record
  static async create({ studentId, absenceDate, dayOfWeek, status = 'unapproved', notes = '', approvedBy = null, seasonType = 'build' }) {
    const id = uuidv4();
    
    const query = `
      INSERT INTO absences (id, student_id, absence_date, day_of_week, status, notes, approved_by, season_type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [id, studentId, absenceDate, dayOfWeek, status, notes, approvedBy, seasonType];
    const result = await db.query(query, values);
    
    // Create audit log entry
    if (approvedBy) {
      await this.createAuditLog(id, 'created', approvedBy, { status, notes });
    }
    
    return result.rows[0];
  }

  // Get absence by ID
  static async findById(id) {
    const query = 'SELECT * FROM absences WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Get absences for a student on a specific date
  static async findByStudentAndDate(studentId, absenceDate) {
    const query = 'SELECT * FROM absences WHERE student_id = $1 AND absence_date = $2';
    const result = await db.query(query, [studentId, absenceDate]);
    return result.rows[0];
  }

  // Get absences for a student within a date range
  static async findByStudentAndDateRange(studentId, startDate, endDate) {
    const query = `
      SELECT * FROM absences 
      WHERE student_id = $1 AND absence_date BETWEEN $2 AND $3
      ORDER BY absence_date DESC
    `;
    
    const result = await db.query(query, [studentId, startDate, endDate]);
    return result.rows;
  }

  // Get all unapproved absences
  static async findUnapproved() {
    const query = `
      SELECT a.*, u.alias as student_alias, u.first_name, u.last_name 
      FROM absences a
      JOIN users u ON a.student_id = u.id
      WHERE a.status = 'unapproved'
      ORDER BY a.absence_date DESC
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  // Get absences for reporting (date range, with student info)
  static async findForReport(startDate, endDate, seasonType = 'build') {
    const query = `
      SELECT 
        a.*,
        u.alias as student_alias,
        u.first_name,
        u.last_name
      FROM absences a
      JOIN users u ON a.student_id = u.id
      WHERE a.absence_date BETWEEN $1 AND $2 AND a.season_type = $3
      ORDER BY u.alias ASC, a.absence_date DESC
    `;
    
    const result = await db.query(query, [startDate, endDate, seasonType]);
    return result.rows;
  }

  // Get future absences (approved and unapproved)
  static async findFutureAbsences() {
    const today = new Date().toISOString().split('T')[0];
    const query = `
      SELECT 
        a.*,
        u.alias as student_alias,
        u.first_name,
        u.last_name
      FROM absences a
      JOIN users u ON a.student_id = u.id
      WHERE a.absence_date > $1
      ORDER BY a.absence_date ASC, u.alias ASC
    `;
    
    const result = await db.query(query, [today]);
    return result.rows;
  }

  // Update absence (approve, change status, add notes)
  static async update(id, { status, notes, approvedBy, updatedBy }) {
    // Get current record to track changes
    const current = await this.findById(id);
    
    const changes = {};
    if (status !== undefined && status !== current.status) {
      changes.status = { from: current.status, to: status };
    }
    if (notes !== undefined && notes !== current.notes) {
      changes.notes = { from: current.notes, to: notes };
    }
    if (approvedBy !== undefined && approvedBy !== current.approved_by) {
      changes.approved_by = { from: current.approved_by, to: approvedBy };
    }
    
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (status !== undefined) {
      fields.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }
    if (notes !== undefined) {
      fields.push(`notes = $${paramCount}`);
      values.push(notes);
      paramCount++;
    }
    if (approvedBy !== undefined) {
      fields.push(`approved_by = $${paramCount}`);
      values.push(approvedBy);
      paramCount++;
    }
    
    fields.push(`updated_at = NOW()`);
    values.push(id);
    
    const query = `UPDATE absences SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await db.query(query, values);
    
    // Create audit log entry
    if (Object.keys(changes).length > 0 && updatedBy) {
      await this.createAuditLog(id, 'updated', updatedBy, changes);
    }
    
    return result.rows[0];
  }

  // Create audit log entry
  static async createAuditLog(absenceId, action, userId, changes) {
    const id = uuidv4();
    
    const query = `
      INSERT INTO absence_logs (id, absence_id, action, user_id, changes, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    
    const values = [id, absenceId, action, userId, JSON.stringify(changes)];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Get audit log for an absence
  static async getAuditLog(absenceId) {
    const query = `
      SELECT 
        al.*,
        u.alias as user_alias,
        u.first_name,
        u.last_name
      FROM absence_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.absence_id = $1
      ORDER BY al.created_at DESC
    `;
    
    const result = await db.query(query, [absenceId]);
    return result.rows;
  }

  // Get all absences for a date range with audit logs
  static async findForDetailedReport(startDate, endDate) {
    const query = `
      SELECT 
        a.*,
        u.alias as student_alias,
        u.first_name,
        u.last_name,
        (SELECT json_agg(
          json_build_object(
            'action', al.action,
            'user_alias', u2.alias,
            'created_at', al.created_at,
            'changes', al.changes
          )
        ) FROM absence_logs al
        JOIN users u2 ON al.user_id = u2.id
        WHERE al.absence_id = a.id) as audit_logs
      FROM absences a
      JOIN users u ON a.student_id = u.id
      WHERE a.absence_date BETWEEN $1 AND $2
      ORDER BY u.alias ASC, a.absence_date DESC
    `;
    
    const result = await db.query(query, [startDate, endDate]);
    return result.rows;
  }
}

module.exports = Absence;
