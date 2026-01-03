const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class AuditLog {
  static async create({ actorUserId, actionType, targetUserId = null, details = {} }) {
    const id = uuidv4();
    
    const query = `
      INSERT INTO audit_log (id, actor_user_id, action_type, target_user_id, details)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [id, actorUserId, actionType, targetUserId, JSON.stringify(details)];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const query = `
      SELECT * FROM audit_log 
      WHERE actor_user_id = $1 OR target_user_id = $1
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async findByActionType(actionType) {
    const query = `
      SELECT * FROM audit_log 
      WHERE action_type = $1
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [actionType]);
    return result.rows;
  }

  static async findAll(limit = 100) {
    const query = `
      SELECT 
        al.*,
        actor.alias as actor_alias,
        target.alias as target_alias
      FROM audit_log al
      LEFT JOIN users actor ON al.actor_user_id = actor.id
      LEFT JOIN users target ON al.target_user_id = target.id
      ORDER BY al.created_at DESC
      LIMIT $1
    `;
    const result = await db.query(query, [limit]);
    return result.rows;
  }
}

module.exports = AuditLog;
