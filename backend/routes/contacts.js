const express = require('express');
const { body, param, validationResult } = require('express-validator');
const ContactController = require('../controllers/contactController');
const { requireMentorOrCoach, requireAuth } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateUserId = [
  param('id').isUUID().withMessage('Invalid user ID'),
];

const validateContactId = [
  param('contactId').isUUID().withMessage('Invalid contact ID'),
];

const validateCreateContact = [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('phoneNumber').isString().trim().notEmpty().withMessage('Phone number is required'),
  body('relationship').optional().isString().trim(),
];

const validateUpdateContact = [
  body('name').optional().isString().trim().notEmpty(),
  body('phoneNumber').optional().isString().trim().notEmpty(),
  body('relationship').optional().isString().trim(),
];

// Error handler for validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /contacts/me - Get current user's contacts
router.get('/contacts/me', requireAuth, ContactController.getMyContacts);

// POST /contacts/me - Add a contact for current user
router.post('/contacts/me', requireAuth, validateCreateContact, handleValidationErrors, ContactController.createMyContact);

// GET /users/:id/contacts - Get all contacts for a user (admin only)
router.get('/users/:id/contacts', requireMentorOrCoach, validateUserId, handleValidationErrors, ContactController.getByUserId);

// POST /users/:id/contacts - Add a new contact (admin only)
router.post('/users/:id/contacts', requireMentorOrCoach, validateUserId, validateCreateContact, handleValidationErrors, ContactController.create);

// PATCH /contacts/:contactId - Update a contact
router.patch('/contacts/:contactId', requireAuth, validateContactId, validateUpdateContact, handleValidationErrors, ContactController.update);

// DELETE /contacts/:contactId - Delete a contact
router.delete('/contacts/:contactId', requireAuth, validateContactId, handleValidationErrors, ContactController.delete);

module.exports = router;
