const ParentContact = require('../models/ParentContact');
const AuditLog = require('../models/AuditLog');

class ContactController {
  // GET /contacts/me - Get current user's contacts
  static async getMyContacts(req, res) {
    try {
      const userId = req.user.id;
      const contacts = await ParentContact.findByUserId(userId);
      res.json(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  }

  // POST /contacts/me - Add a contact for current user
  static async createMyContact(req, res) {
    try {
      const userId = req.user.id;
      const { name, phoneNumber, relationship } = req.body;

      if (!name || !phoneNumber) {
        return res.status(400).json({ 
          error: 'Name and phone number are required' 
        });
      }

      const contact = await ParentContact.create({
        userId,
        name,
        phoneNumber,
        relationship,
      });

      // Log the action
      await AuditLog.create({
        actorUserId: userId,
        actionType: 'ADD_CONTACT',
        targetUserId: userId,
        details: { contactName: name },
      });

      res.status(201).json(contact);
    } catch (error) {
      console.error('Error creating contact:', error);
      res.status(500).json({ error: 'Failed to create contact' });
    }
  }

  // GET /users/:id/contacts - Get all contacts for a user
  static async getByUserId(req, res) {
    try {
      const { id } = req.params;
      const contacts = await ParentContact.findByUserId(id);
      res.json(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  }

  // POST /users/:id/contacts - Add a new contact
  static async create(req, res) {
    try {
      const { id } = req.params;
      const { name, phoneNumber, relationship } = req.body;

      if (!name || !phoneNumber) {
        return res.status(400).json({ 
          error: 'Name and phone number are required' 
        });
      }

      const contact = await ParentContact.create({
        userId: id,
        name,
        phoneNumber,
        relationship,
      });

      // Log the action
      if (req.user) {
        await AuditLog.create({
          actorUserId: req.user.id,
          actionType: 'ADD_CONTACT',
          targetUserId: id,
          details: { contactId: contact.id, name },
        });
      }

      res.status(201).json(contact);
    } catch (error) {
      console.error('Error creating contact:', error);
      res.status(500).json({ error: 'Failed to create contact' });
    }
  }

  // PATCH /contacts/:contactId - Update a contact
  static async update(req, res) {
    try {
      const { contactId } = req.params;
      const updates = req.body;

      const contact = await ParentContact.update(contactId, updates);
      
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      // Log the action
      if (req.user) {
        await AuditLog.create({
          actorUserId: req.user.id,
          actionType: 'UPDATE_CONTACT',
          targetUserId: contact.user_id,
          details: { contactId, updates },
        });
      }

      res.json(contact);
    } catch (error) {
      console.error('Error updating contact:', error);
      res.status(500).json({ error: 'Failed to update contact' });
    }
  }

  // DELETE /contacts/:contactId - Delete a contact
  static async delete(req, res) {
    try {
      const { contactId } = req.params;
      
      // Get contact first to check user_id and verify count
      const contact = await ParentContact.findById(contactId);
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      // Check if this is the last contact for a student
      const contactCount = await ParentContact.countByUserId(contact.user_id);
      if (contactCount <= 1) {
        return res.status(400).json({ 
          error: 'Cannot delete the last contact. Users must have at least one contact.' 
        });
      }

      await ParentContact.delete(contactId);

      // Log the action
      if (req.user) {
        await AuditLog.create({
          actorUserId: req.user.id,
          actionType: 'DELETE_CONTACT',
          targetUserId: contact.user_id,
          details: { contactId, name: contact.name },
        });
      }

      res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
      console.error('Error deleting contact:', error);
      res.status(500).json({ error: 'Failed to delete contact' });
    }
  }
}

module.exports = ContactController;
