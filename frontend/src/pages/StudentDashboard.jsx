import React, { useState, useEffect } from 'react';
import { kioskApi, contactApi, attendanceApi, absenceApi } from '../services/api';
import './StudentDashboard.css';

function StudentDashboard({ userName, userId, userRole, onLogout }) {
  const [checkedIn, setCheckedIn] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [reflectionPrompt, setReflectionPrompt] = useState('');
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'contacts', 'attendance', 'absences'
  const [editingContact, setEditingContact] = useState(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    name: '',
    phoneNumber: '',
    relationship: '',
  });
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [absenceHistory, setAbsenceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    checkInStatus();
    loadContacts();
    loadReflectionPrompt();
    loadAttendanceHistory();
    loadAbsenceHistory();
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

  const loadAttendanceHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await attendanceApi.getMyHistory();
      const sessions = response.data.sessions || [];
      sessions.sort((a, b) => new Date(b.check_in_time) - new Date(a.check_in_time));
      setAttendanceHistory(sessions);
    } catch (err) {
      console.error('Failed to load attendance history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatDateTimeCompact = (dt) => {
    if (!dt) return '—';
    const d = new Date(dt);
    if (Number.isNaN(d.valueOf())) return dt;
    const opts = { month: '2-digit', day: '2-digit', year: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true };
    return d.toLocaleString('en-US', opts);
  };

  const formatDateCompact = (dt) => {
    if (!dt) return '—';
    const d = new Date(dt);
    if (Number.isNaN(d.valueOf())) return dt;
    const opts = { month: '2-digit', day: '2-digit', year: '2-digit' };
    return d.toLocaleDateString('en-US', opts);
  };

  const loadAbsenceHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await absenceApi.getMine();
      const absences = response.data.absences || [];
      absences.sort((a, b) => new Date(b.absence_date) - new Date(a.absence_date));
      setAbsenceHistory(absences);
    } catch (err) {
      console.error('Failed to load absence history');
    } finally {
      setHistoryLoading(false);
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
    // Reflection is required for students only
    if (userRole === 'student' && !reflection.trim()) {
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
          <button
            className={`nav-tab ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            Attendance History
          </button>
          <button
            className={`nav-tab ${activeTab === 'absences' ? 'active' : ''}`}
            onClick={() => setActiveTab('absences')}
          >
            Absence History
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
                  <label>
                    {reflectionPrompt}
                    {userRole !== 'student' && <span className="optional-label">(Optional for mentors/coaches)</span>}
                  </label>
                  <textarea
                    className="reflection-textarea"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    rows="5"
                    placeholder={userRole === 'student' ? 'Enter your reflection...' : 'Enter your reflection (optional)...'}
                  />
                </div>
                <button
                  className="btn btn-large btn-primary"
                  onClick={handleCheckOut}
                  disabled={loading || (userRole === 'student' && !reflection.trim())}
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

        {activeTab === 'attendance' && (
          <div className="history-section">
            <h2>Your Attendance History</h2>
            {historyLoading ? (
              <div className="loading">Loading history...</div>
            ) : attendanceHistory.length === 0 ? (
              <p>No attendance records found.</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Minutes</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map((session) => {
                    const minutes = session.duration_minutes || (session.check_out_time && session.check_in_time ? Math.round((new Date(session.check_out_time) - new Date(session.check_in_time)) / 60000) : '');
                    return (
                      <tr key={session.id}>
                        <td>{formatDateTimeCompact(session.check_in_time)}</td>
                        <td>{session.check_out_time ? formatDateTimeCompact(session.check_out_time) : '—'}</td>
                        <td>{minutes !== '' ? minutes : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'absences' && (
          <div className="history-section">
            <h2>Your Absence History</h2>
            {historyLoading ? (
              <div className="loading">Loading history...</div>
            ) : absenceHistory.length === 0 ? (
              <p>No absences found.</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {absenceHistory.map((abs) => (
                    <tr key={abs.id}>
                      <td>{formatDateCompact(abs.absence_date)}</td>
                      <td>{abs.status}</td>
                      <td>{abs.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;
