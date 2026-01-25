import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { kioskApi, contactApi, attendanceApi, absenceApi } from '../services/api';
import RoboticsIllustration from '../components/RoboticsIllustration';
import './StudentDashboard.css';

const GOODBYE_MESSAGES = [
  'Power down safely, team.',
  'See you next cycle.',
  'Don’t forget to recharge your human batteries.',
  'Log off and live your best analog life.',
  'May your homework require zero troubleshooting.',
  'Go forth and debug your evening.',
  'Stay calibrated out there.',
  'Avoid unplanned rapid unscheduled disassembly.',
  'Walk safely — no autonomous mode in the hallways.',
  'See you next build session, legends.',
  'Don’t forget to hydrate your CPU.',
  'May your dreams be free of wiring gremlins.',
  'Go home before the mentors start glitching.',
  'Thanks for today — your effort was 10/10, no notes.',
  'Remember: safety glasses off, thinking caps on.',
  'See you tomorrow, same bot time, same bot place.',
  'Go home and let your neurons cool.',
  'May your evening be free of stripped screws.',
  'Don’t forget to charge your batteries — both kinds.',
  'Powering down student subroutines… goodbye.',
  'Go forth and be less chaotic than the pit.',
  'See you next time, drivetrain dynamos.',
  'Don’t let the door hit your bumper.',
  'May your code compile on the first try tonight.',
  'You survived practice — reward yourself accordingly.',
  'Time to switch from robot mode to human mode.',
  'Go home before the robot starts missing you.',
  'Thanks for building cool stuff today.',
  'See you later, champions of controlled chaos.',
  'Don’t forget your water bottle… again.',
  'May your evening be more stable than our prototype.',
  'Go home and brag about your robot to someone.',
  'See you next meeting — bring your A‑game and maybe snacks.',
  'Time to leave the shop before the zip ties unionize.',
  'Stay awesome, stay curious, stay unbroken.',
  'Go recharge — you’ve earned it.',
  'See you later, future engineers.',
  'Don’t forget to unpair from Bluetooth on your way out.',
  'May your night be free of unexpected exceptions.',
  'Go home before the mentors start speaking in binary.',
  'Thanks for keeping the robot (mostly) in one piece today.',
  'See you next time — same chaos, new problems.',
  'Don’t forget to unplug the soldering iron of life.',
  'May your homework be easier than aligning a shaft collar.',
  'Go home and let your brain defragment.',
  'See you later, code wizards.',
  'Don’t forget: safety never sleeps, but you should.',
  'May your dinner be more reliable than our intake.',
  'Go forth and avoid cross-threading anything.',
  'See you next meeting — bring your best ideas.',
  'Time to leave the lab before the robot gains sentience.',
  'Stay sharp, stay safe, stay servo‑smooth.',
  'Go home and practice your victory pose.',
  'See you later, mechanical masterminds.',
  'Don’t forget to return your tools… looking at you.',
  'May your evening be free of burnt motors.',
  'Go home and let your creativity idle.',
  'See you next time — we’ll build something even cooler.',
  'Don’t forget to update your mental firmware.',
  'May your night be free of loose bolts.',
  'Go forth and be the autonomous version of yourself.',
  'See you later, champions of torque.',
  'Don’t forget to clean your shoes — the shop floor is judging you.',
  'May your dreams be full of perfect cycles.',
  'Go home before the robot starts asking for snacks.',
  'See you next time — bring your brain and your enthusiasm.',
  'Don’t forget to unstick the duct tape from your soul.',
  'May your evening be smoother than a well‑tuned PID loop.',
  'Go forth and avoid unnecessary friction.',
  'See you later, wiring warriors.',
  'Don’t forget to stretch — robots aren’t the only ones that need maintenance.',
  'May your night be free of CAN bus errors.',
  'Go home and let your creativity reboot.',
  'See you next time — we’ll conquer the next challenge.',
  'Don’t forget to take your hoodie — we have enough lost‑and‑found already.',
  'May your evening be more stable than our prototype chassis.',
  'Go forth and be the spark that ignites innovation.',
  'See you later, gear‑grinding geniuses.',
  'Don’t forget to check your pockets for hex keys.',
  'May your night be free of stripped screws.',
  'Go home and let your imagination idle.',
  'See you next time — the robot believes in you.',
  'Don’t forget to power down gracefully.',
  'May your evening be full of good vibes and good voltage.',
  'Go forth and avoid unnecessary debugging.',
  'See you later, champions of controlled torque.',
  'Don’t forget to leave the stress in the shop.',
  'May your night be free of jammed bearings.',
  'Go home and let your brain cool to operating temperature.',
  'See you next time — bring your brilliance.',
  'Don’t forget to take your backpack — again.',
  'May your evening be smoother than a perfectly aligned drivetrain.',
  'Go forth and be the human version of a well‑tuned robot.',
  'See you later, innovators.',
  'Don’t forget to unplug from robot mode.',
  'May your night be free of unexpected vibrations.',
  'Go home and let your creativity recharge.',
  'See you next time — we’ll build the future together.',
  'Don’t forget to take your snacks — ants love robotics too.',
  'May your evening be full of inspiration, not error messages.',
];

const getRandomGoodbye = () => {
  const index = Math.floor(Math.random() * GOODBYE_MESSAGES.length);
  return GOODBYE_MESSAGES[index];
};

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
      setSuccess(getRandomGoodbye());
      setLoading(false);
      // Auto-logout after successful check-out
      setTimeout(() => {
        if (onLogout) onLogout();
      }, 5000);
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
      <header className="dashboard-header">
        <div className="header-content">
          <div className="robot-mascot">
            <RoboticsIllustration />
          </div>
          <div className="header-text">
            <h1>Robotics Attendance</h1>
            <p className="tagline">Welcome back, {userName}!</p>
          </div>
        </div>
        
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
        
        <div className="header-actions">
          {userRole && userRole !== 'student' && (
            <Link className="admin-btn" to="/admin">
              Admin
            </Link>
          )}
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="student-container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success goodbye-message">{success}</div>}

        {activeTab === 'dashboard' && (
          <div className="dashboard-section">
            <div className="status-card">
              <div className="user-identity">
                <span className="user-name">{userName}</span>
                <span className="user-role-badge">{userRole}</span>
              </div>
              
              <div className="status-indicator">
                <div className={`status-dot ${checkedIn ? 'checked-in' : 'checked-out'}`}></div>
                <p className="status-text">
                  {checkedIn ? (
                    currentSession ? 
                      `Currently Checked In at ${new Date(currentSession.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                      : 'Currently Checked In'
                  ) : 'Currently Checked Out'}
                </p>
              </div>
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
                <div className="reflection-container">
                  <div className="reflection-header">
                    <label className="reflection-label">
                      {reflectionPrompt}
                    </label>
                    {userRole === 'student' ? (
                      <span className="required-badge">REQUIRED</span>
                    ) : (
                      <span className="optional-badge">OPTIONAL</span>
                    )}
                  </div>
                  <textarea
                    className="reflection-textarea"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    rows="5"
                    placeholder={userRole === 'student' ? 'Enter your reflection to check out...' : 'Enter your reflection (optional)...'}
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
