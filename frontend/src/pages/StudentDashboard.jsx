import React, { useState, useEffect } from 'react';
import { kioskApi, contactApi, attendanceApi } from '../services/api';
import './StudentDashboard.css';

function StudentDashboard({ userName, userId, onLogout }) {
  const [checkedIn, setCheckedIn] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [reflectionPrompt, setReflectionPrompt] = useState('');
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'contacts'
  const [editingContact, setEditingContact] = useState(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    name: '',
    phoneNumber: '',
    relationship: '',
  });

  useEffect(() => {
    checkInStatus();
    loadContacts();
    loadReflectionPrompt();
  }, [userId]);

  const checkInStatus = async () => {
    try {
      const response = await attendanceApi.getCurrentStatus();
      setCheckedIn(response.data.checkedIn);
      setCurrentSession(response.data.session);
    } catch (err) {
      console.error('Failed to check status');
    }
  };

  const loadContacts = async () => {
    try {
      const response = await contactApi.getMyContacts();
      setContacts(response.data);
    } catch (err) {
      console.error('Failed to load contacts');
    }
  };

  const loadReflectionPrompt = async () => {
    try {
      const response = await kioskApi.getReflectionPrompt();
      setReflectionPrompt(response.data.prompt);
    } catch (err) {
      console.error('Failed to load reflection prompt');
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await kioskApi.checkIn();
      setSuccess('Successfully checked in!');
      // Auto-logout after successful check-in
      setTimeout(() => {
        if (onLogout) onLogout();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Check-in failed');
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!reflection.trim()) {
      setError('Please enter a reflection before checking out');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await kioskApi.checkOut(reflection);
      setSuccess('Successfully checked out!');
      // Auto-logout after successful check-out
      setTimeout(() => {
        if (onLogout) onLogout();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Check-out failed');
      setLoading(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!contactFormData.name || !contactFormData.phoneNumber) {
      setError('Name and phone number are required');
      return;
    }

    setLoading(true);
    try {
      await contactApi.createMyContact(contactFormData);
      setContactFormData({ name: '', phoneNumber: '', relationship: '' });
      setShowAddContact(false);
      setSuccess('Contact added successfully!');
      loadContacts();
    } catch (err) {
      setError('Failed to add contact: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    if (!contactFormData.name || !contactFormData.phoneNumber) {
      setError('Name and phone number are required');
      return;
    }

    setLoading(true);
    try {
      await contactApi.update(editingContact.id, contactFormData);
      setEditingContact(null);
      setContactFormData({ name: '', phoneNumber: '', relationship: '' });
      setSuccess('Contact updated successfully!');
      loadContacts();
    } catch (err) {
      setError('Failed to update contact: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (contacts.length <= 1) {
      setError('You must have at least one contact. Cannot delete the last contact.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this contact?')) {
      setLoading(true);
      try {
        await contactApi.delete(contactId);
        setSuccess('Contact deleted successfully!');
        loadContacts();
      } catch (err) {
        setError('Failed to delete contact: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  const startEditContact = (contact) => {
    setEditingContact(contact);
    setContactFormData({
      name: contact.name,
      phoneNumber: contact.phone_number,
      relationship: contact.relationship || '',
    });
  };

  const cancelEdit = () => {
    setEditingContact(null);
    setShowAddContact(false);
    setContactFormData({ name: '', phoneNumber: '', relationship: '' });
  };

  return (
    <div className="student-dashboard">
      <div className="student-container">
        <h1>Welcome, {userName}!</h1>

        <nav className="student-nav">
          <button
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Check In/Out
          </button>
          <button
            className={`nav-tab ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            My Contacts
          </button>
        </nav>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {activeTab === 'dashboard' && (
          <div className="dashboard-section">
            <div className="status-card">
              <div className="status-indicator">
                <div className={`status-dot ${checkedIn ? 'checked-in' : 'checked-out'}`}></div>
                <p className="status-text">
                  {checkedIn ? 'Currently Checked In' : 'Currently Checked Out'}
                </p>
              </div>

              {checkedIn && currentSession && (
                <p className="session-info">
                  Checked in at{' '}
                  {new Date(currentSession.check_in_time).toLocaleTimeString()}
                </p>
              )}
            </div>

            {!checkedIn ? (
              <button
                className="btn btn-large btn-success"
                onClick={handleCheckIn}
                disabled={loading}
              >
                {loading ? 'Checking In...' : 'Check In'}
              </button>
            ) : (
              <div className="checkout-section">
                <div className="form-group">
                  <label>{reflectionPrompt}</label>
                  <textarea
                    className="reflection-textarea"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    rows="5"
                    placeholder="Enter your reflection..."
                  />
                </div>
                <button
                  className="btn btn-large btn-primary"
                  onClick={handleCheckOut}
                  disabled={loading || !reflection.trim()}
                >
                  {loading ? 'Checking Out...' : 'Check Out'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="contacts-section">
            <h2>Parent/Guardian Contacts</h2>

            {/* Contact List */}
            {contacts.length > 0 && !editingContact && !showAddContact && (
              <div className="contacts-list">
                {contacts.map((contact) => (
                  <div key={contact.id} className="contact-card">
                    <div className="contact-info">
                      <h4>{contact.name}</h4>
                      <p>
                        <strong>Phone:</strong> {contact.phone_number}
                      </p>
                      {contact.relationship && (
                        <p>
                          <strong>Relationship:</strong> {contact.relationship}
                        </p>
                      )}
                    </div>
                    <div className="contact-actions">
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => startEditContact(contact)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteContact(contact.id)}
                        disabled={loading || contacts.length <= 1}
                        title={contacts.length <= 1 ? 'Cannot delete last contact' : 'Delete contact'}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add/Edit Contact Form */}
            {(editingContact || showAddContact || contacts.length === 0) && (
              <div className="form-container">
                <h3>{editingContact ? 'Edit Contact' : 'Add New Contact'}</h3>
                <form
                  onSubmit={editingContact ? handleUpdateContact : handleAddContact}
                >
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={contactFormData.name}
                      onChange={(e) =>
                        setContactFormData({
                          ...contactFormData,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      value={contactFormData.phoneNumber}
                      onChange={(e) =>
                        setContactFormData({
                          ...contactFormData,
                          phoneNumber: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Relationship</label>
                    <input
                      type="text"
                      value={contactFormData.relationship}
                      onChange={(e) =>
                        setContactFormData({
                          ...contactFormData,
                          relationship: e.target.value,
                        })
                      }
                      placeholder="e.g., Parent, Guardian"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-success" disabled={loading}>
                      {editingContact ? 'Save Changes' : 'Add Contact'}
                    </button>
                    {editingContact && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Add Contact Button */}
            {contacts.length > 0 && !editingContact && !showAddContact && (
              <button
                className="btn btn-primary"
                onClick={() => setShowAddContact(true)}
                style={{ marginTop: '1rem' }}
              >
                + Add Another Contact
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;
