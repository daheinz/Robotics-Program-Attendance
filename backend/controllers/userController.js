const User = require('../models/User');
const ParentContact = require('../models/ParentContact');
const AuditLog = require('../models/AuditLog');

class UserController {
  // GET /users - Get all users
  static async getAll(req, res) {
    try {
      const { role } = req.query;
      const filters = {};
      
      if (role) {
        filters.role = role;
      }
      
      const users = await User.findAll(filters);
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  // GET /users/:id - Get user by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  // POST /users - Create new user
  static async create(req, res) {
    try {
      const { firstName, middleName, lastName, alias, role, pin } = req.body;

      if (!firstName || !lastName || !alias || !role || !pin) {
        return res.status(400).json({ 
          error: 'First name, last name, alias, role, and PIN are required' 
        });
      }

      if (!['student', 'mentor', 'coach'].includes(role)) {
        return res.status(400).json({ 
          error: 'Invalid role. Must be student, mentor, or coach' 
        });
      }

      // Check if alias is already taken
      const existingUser = await User.findByAlias(alias);
      if (existingUser) {
        return res.status(409).json({ error: 'Alias already exists' });
      }

      const user = await User.create({
        firstName,
        middleName,
        lastName,
        alias,
        role,
        pin,
      });

      // Log the action
      if (req.user) {
        await AuditLog.create({
          actorUserId: req.user.id,
          actionType: 'CREATE_USER',
          targetUserId: user.id,
          details: { alias, role },
        });
      }

      // Don't return pin_hash
      const { pin_hash, ...userWithoutPin } = user;
      
      res.status(201).json(userWithoutPin);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  // PATCH /users/:id - Update user
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const user = await User.update(id, updates);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log the action
      if (req.user) {
        await AuditLog.create({
          actorUserId: req.user.id,
          actionType: 'UPDATE_USER',
          targetUserId: id,
          details: updates,
        });
      }

      const { pin_hash, ...userWithoutPin } = user;
      res.json(userWithoutPin);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  // PATCH /users/:id/alias - Update user alias
  static async updateAlias(req, res) {
    try {
      const { id } = req.params;
      const { alias } = req.body;

      if (!alias) {
        return res.status(400).json({ error: 'Alias is required' });
      }

      // Check if new alias is already taken
      const existingUser = await User.findByAlias(alias);
      if (existingUser && existingUser.id !== id) {
        return res.status(409).json({ error: 'Alias already exists' });
      }

      const user = await User.updateAlias(id, alias);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log the action
      if (req.user) {
        await AuditLog.create({
          actorUserId: req.user.id,
          actionType: 'UPDATE_ALIAS',
          targetUserId: id,
          details: { newAlias: alias },
        });
      }

      const { pin_hash, ...userWithoutPin } = user;
      res.json(userWithoutPin);
    } catch (error) {
      console.error('Error updating alias:', error);
      res.status(500).json({ error: 'Failed to update alias' });
    }
  }

  // PATCH /users/:id/pin - Update user PIN (admin only)
  static async updatePin(req, res) {
    try {
      const { id } = req.params;
      const { pin } = req.body;

      if (!pin) {
        return res.status(400).json({ error: 'PIN is required' });
      }

      const user = await User.updatePin(id, pin);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log the action
      if (req.user) {
        await AuditLog.create({
          actorUserId: req.user.id,
          actionType: 'RESET_PIN',
          targetUserId: id,
          details: {},
        });
      }

      res.json({ message: 'PIN updated successfully' });
    } catch (error) {
      console.error('Error updating PIN:', error);
      res.status(500).json({ error: 'Failed to update PIN' });
    }
  }

  // DELETE /users/:id - Soft delete user
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const user = await User.softDelete(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log the action
      if (req.user) {
        await AuditLog.create({
          actorUserId: req.user.id,
          actionType: 'DELETE_USER',
          targetUserId: id,
          details: { alias: user.alias },
        });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
}

module.exports = UserController;
