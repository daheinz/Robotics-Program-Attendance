const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class User {
  static async create({ firstName, middleName = null, lastName, alias, role, pin }) {
    const id = uuidv4();
    const pinHash = await bcrypt.hash(pin, 10);
    
    const query = `
      INSERT INTO users (id, first_name, middle_name, last_name, alias, role, pin_hash, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [id, firstName, middleName, lastName, alias, role, pinHash, true];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByAlias(alias) {
    const query = 'SELECT * FROM users WHERE alias = $1 AND is_active = true';
    const result = await db.query(query, [alias]);
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM users WHERE is_active = true';
    const values = [];
    
    if (filters.role) {
      values.push(filters.role);
      query += ` AND role = $${values.length}`;
    }
    
    query += ' ORDER BY alias ASC';
    
    const result = await db.query(query, values);
    return result.rows;
  }

  static async getActiveUsers() {
    const query = `
      SELECT id, alias, role 
      FROM users 
      WHERE is_active = true 
      ORDER BY alias ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async update(id, updates) {
    const allowedUpdates = ['first_name', 'middle_name', 'last_name', 'alias', 'is_active'];
    const setClause = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedUpdates.includes(snakeKey)) {
        values.push(updates[key]);
        setClause.push(`${snakeKey} = $${values.length}`);
      }
    });
    
    if (setClause.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    values.push(id);
    const query = `
      UPDATE users 
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async updateAlias(id, alias) {
    const query = `
      UPDATE users 
      SET alias = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [alias, id]);
    return result.rows[0];
  }

  static async updatePin(id, newPin) {
    const pinHash = await bcrypt.hash(newPin, 10);
    const query = `
      UPDATE users 
      SET pin_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [pinHash, id]);
    return result.rows[0];
  }

  static async verifyPin(userId, pin) {
    const user = await this.findById(userId);
    if (!user) return false;
    return bcrypt.compare(pin, user.pin_hash);
  }

  static async hasContacts(userId) {
    const query = 'SELECT COUNT(*) as count FROM parent_contacts WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    return parseInt(result.rows[0].count) > 0;
  }

  static async softDelete(id) {
    const query = `
      UPDATE users 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;
