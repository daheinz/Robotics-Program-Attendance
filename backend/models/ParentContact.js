const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ParentContact {
  static async create({ userId, name, phoneNumber, relationship = null }) {
    const id = uuidv4();
    
    const query = `
      INSERT INTO parent_contacts (id, user_id, name, phone_number, relationship)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [id, userId, name, phoneNumber, relationship];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM parent_contacts WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const query = `
      SELECT * FROM parent_contacts 
      WHERE user_id = $1 
      ORDER BY created_at ASC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async update(id, updates) {
    const allowedUpdates = ['name', 'phone_number', 'relationship'];
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
      UPDATE parent_contacts 
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM parent_contacts WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async countByUserId(userId) {
    const query = 'SELECT COUNT(*) as count FROM parent_contacts WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = ParentContact;
