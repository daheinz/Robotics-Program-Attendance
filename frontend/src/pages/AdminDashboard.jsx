import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { userApi, settingsApi, contactApi, attendanceApi } from '../services/api';
import './AdminDashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [userRole] = useState(localStorage.getItem('userRole') || 'mentor');

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="header-right">
          <span className="user-role">Role: {userRole}</span>
          <Link to="/" className="btn btn-secondary">
            ← Back to Home
          </Link>
        </div>
      </header>

      <div className="dashboard-container">
        <nav className="dashboard-nav">
          <button
            className={`nav-tab ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            Attendance
          </button>
          <button
            className={`nav-tab ${activeTab === 'absences' ? 'active' : ''}`}
            onClick={() => setActiveTab('absences')}
          >
            Absences
          </button>
          <button
            className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`nav-tab ${activeTab === 'reflections' ? 'active' : ''}`}
            onClick={() => setActiveTab('reflections')}
          >
            Reflections
          </button>
          <button
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button
            className={`nav-tab ${activeTab === 'testing' ? 'active' : ''}`}
            onClick={() => setActiveTab('testing')}
          >
            Testing
          </button>
        </nav>

        <div className="dashboard-content">
          {activeTab === 'users' && <UsersTab userRole={userRole} />}
          {activeTab === 'contacts' && <ContactsTab userRole={userRole} />}
          {activeTab === 'attendance' && <AttendanceTab />}
          {activeTab === 'reflections' && <ReflectionsTab />}
          {activeTab === 'absences' && <AbsencesTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'testing' && <TestingTab />}
        </div>
      </div>
    </div>
  );
}

function UsersTab({ userRole }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    alias: '',
    role: 'student',
    pin: '',
    middleName: '',
  });

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await userApi.getAll();
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.alias || !formData.pin) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await userApi.create(formData);
      setFormData({
        firstName: '',
        lastName: '',
        alias: '',
        role: 'student',
        pin: '',
        middleName: '',
      });
      setShowCreateForm(false);
      setError('');
      fetchUsers();
    } catch (err) {
      setError('Failed to create user: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await userApi.update(editingUser.id, {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
      });
      
      // Update alias separately if changed
      if (formData.alias !== editingUser.alias) {
        await userApi.updateAlias(editingUser.id, formData.alias);
      }

      // Update PIN if provided
      if (formData.pin) {
        await userApi.updatePin(editingUser.id, formData.pin);
      }
      
      setEditingUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        alias: '',
        role: 'student',
        pin: '',
        middleName: '',
      });
      setError('');
      fetchUsers();
    } catch (err) {
      setError('Failed to update user: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userRole !== 'coach') {
      setError('Only coaches can delete users');
      return;
    }
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userApi.delete(userId);
        fetchUsers();
      } catch (err) {
        setError('Failed to delete user: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleResetPin = async (userId) => {
    if (userRole !== 'coach') {
      setError('Only coaches can reset PINs');
      return;
    }
    const newPin = prompt('Enter new PIN:');
    if (newPin) {
      try {
        await userApi.updatePin(userId, newPin);
        alert('PIN reset successfully');
        fetchUsers();
      } catch (err) {
        setError('Failed to reset PIN: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setFormData({
      firstName: user.first_name,
      lastName: user.last_name,
      alias: user.alias,
      role: user.role,
      pin: '',
      middleName: user.middle_name || '',
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setShowCreateForm(false);
    setFormData({
      firstName: '',
      lastName: '',
      alias: '',
      role: 'student',
      pin: '',
      middleName: '',
    });
    setError('');
  };

  return (
    <div className="tab-content">
      <div className="users-header">
        <h2>User Management</h2>
        {!editingUser && (
          <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'Cancel' : '+ Add New User'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {(showCreateForm || editingUser) && (
        <div className="form-container">
          <h3>{editingUser ? 'Edit User' : 'Create New User'}</h3>
          <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Middle Name</label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Alias *</label>
              <input
                type="text"
                value={formData.alias}
                onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                required
              />
            </div>

            {!editingUser && (
              <>
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="student">Student</option>
                    <option value="mentor">Mentor</option>
                    {userRole === 'coach' && <option value="coach">Coach</option>}
                  </select>
                </div>

                <div className="form-group">
                  <label>PIN *</label>
                  <input
                    type="password"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    required
                  />
                </div>
              </>
            )}

            {editingUser && (
              <div className="form-group">
                <label>New PIN (leave blank to keep current PIN)</label>
                <input
                  type="password"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  placeholder="Enter new PIN or leave blank"
                />
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {editingUser ? 'Save Changes' : 'Create User'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className="loading">Loading users...</div>}

      {!loading && users.length === 0 && (
        <div className="no-data">No users found</div>
      )}

      {!loading && users.length > 0 && (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Alias</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.first_name} {user.middle_name && user.middle_name + ' '}
                    {user.last_name}
                  </td>
                  <td>{user.alias}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>{user.role}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn btn-sm btn-info" onClick={() => startEdit(user)}>
                      Edit
                    </button>
                    {userRole === 'coach' && (
                      <>
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleResetPin(user.id)}
                        >
                          Reset PIN
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ContactsTab({ userRole }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    relationship: '',
  });

  // Fetch students on mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await userApi.getAll('student');
      setStudents(response.data);
    } catch (err) {
      setError('Failed to load students: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleStudentSelect = async (e) => {
    const studentId = e.target.value;
    setSelectedStudent(studentId);
    setShowAddForm(false);
    setEditingContact(null);
    setFormData({ name: '', phoneNumber: '', relationship: '' });

    if (studentId) {
      setLoading(true);
      try {
        const response = await contactApi.getByUserId(studentId);
        setContacts(response.data);
        setError('');
      } catch (err) {
        setError('Failed to load contacts: ' + (err.response?.data?.error || err.message));
        setContacts([]);
      } finally {
        setLoading(false);
      }
    } else {
      setContacts([]);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phoneNumber) {
      setError('Name and phone number are required');
      return;
    }

    try {
      await contactApi.create(selectedStudent, formData);
      setFormData({ name: '', phoneNumber: '', relationship: '' });
      setShowAddForm(false);
      setError('');
      handleStudentSelect({ target: { value: selectedStudent } });
    } catch (err) {
      setError('Failed to add contact: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    try {
      await contactApi.update(editingContact.id, {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        relationship: formData.relationship,
      });
      setEditingContact(null);
      setFormData({ name: '', phoneNumber: '', relationship: '' });
      setError('');
      handleStudentSelect({ target: { value: selectedStudent } });
    } catch (err) {
      setError('Failed to update contact: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await contactApi.delete(contactId);
        handleStudentSelect({ target: { value: selectedStudent } });
      } catch (err) {
        setError('Failed to delete contact: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const startEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phoneNumber: contact.phone_number,
      relationship: contact.relationship || '',
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingContact(null);
    setShowAddForm(false);
    setFormData({ name: '', phoneNumber: '', relationship: '' });
    setError('');
  };

  return (
    <div className="tab-content">
      <div className="contacts-header">
        <h2>Parent/Guardian Contacts</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label>Select Student</label>
        <select value={selectedStudent} onChange={handleStudentSelect}>
          <option value="">-- Choose a student --</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.first_name} {student.last_name} ({student.alias})
            </option>
          ))}
        </select>
      </div>

      {selectedStudent && (
        <>
          <div className="contacts-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : '+ Add Contact'}
            </button>
          </div>

          {(showAddForm || editingContact) && (
            <div className="form-container">
              <h3>{editingContact ? 'Edit Contact' : 'Add New Contact'}</h3>
              <form onSubmit={editingContact ? handleUpdateContact : handleAddContact}>
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Relationship</label>
                  <input
                    type="text"
                    value={formData.relationship}
                    onChange={(e) =>
                      setFormData({ ...formData, relationship: e.target.value })
                    }
                    placeholder="e.g., Parent, Guardian, Emergency Contact"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-success">
                    {editingContact ? 'Save Changes' : 'Add Contact'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading && <div className="loading">Loading contacts...</div>}

          {!loading && contacts.length === 0 && !showAddForm && (
            <div className="no-data">No contacts found for this student</div>
          )}

          {!loading && contacts.length > 0 && (
            <div className="contacts-list">
              <h3>Contacts for {students.find((s) => s.id === selectedStudent)?.alias}</h3>
              {contacts.map((contact) => (
                <div key={contact.id} className="contact-card">
                  <div className="contact-info">
                    <h4>{contact.name}</h4>
                    <p className="contact-detail">
                      <strong>Phone:</strong> {contact.phone_number}
                    </p>
                    {contact.relationship && (
                      <p className="contact-detail">
                        <strong>Relationship:</strong> {contact.relationship}
                      </p>
                    )}
                  </div>
                  <div className="contact-actions">
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => startEdit(contact)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteContact(contact.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AttendanceTab() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [range, setRange] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editSessionId, setEditSessionId] = useState(null);
  const [editForm, setEditForm] = useState({ checkInTime: '', checkOutTime: '', reflectionText: '', auditReason: '' });
  const [createForm, setCreateForm] = useState({ userId: '', checkInTime: '', checkOutTime: '', reflectionText: '', auditReason: '' });
  const [quickCheckUserId, setQuickCheckUserId] = useState('');
  const [quickCheckStatus, setQuickCheckStatus] = useState(null);
  const [quickCheckInTime, setQuickCheckInTime] = useState('');
  const [quickCheckOutTime, setQuickCheckOutTime] = useState('');
  const [activeSessionCheckInTime, setActiveSessionCheckInTime] = useState(null);
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [auditLogs, setAuditLogs] = useState({});
  const [deleting, setDeleting] = useState(false);
  const [showQuickCheck, setShowQuickCheck] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);

  useEffect(() => {
    loadUsersAndInitialize();
  }, []);

  const loadUsersAndInitialize = async () => {
    try {
      const res = await userApi.getAll();
      const usersList = res.data.filter(u => u.role === 'student' || u.role === 'mentor' || u.role === 'coach');
      setUsers(usersList);
      // Select all users by default
      setSelectedUsers(usersList.map(u => u.id));
      // Set date range to today
      const today = formatDate(new Date());
      setStartDate(today);
      setEndDate(today);
      setRange('today');
      // Auto-load attendance sessions after a brief delay to ensure state is set
      setTimeout(() => {
        loadAttendanceInitial(usersList, today, today);
      }, 100);
    } catch (err) {
      setError('Failed to load users');
    }
  };

  const loadAttendanceInitial = async (usersList, start, end) => {
    if (usersList.length === 0) return;
    try {
      setLoading(true);
      const res = await attendanceApi.getByRange(start, end, usersList.map(u => u.id));
      setSessions(res.data);
    } catch (err) {
      setError('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await userApi.getAll();
      setUsers(res.data.filter(u => u.role === 'student' || u.role === 'mentor' || u.role === 'coach'));
    } catch (err) {
      setError('Failed to load users');
    }
  };

  // Format date helper
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const setDateRangeToToday = () => {
    const today = formatDate(new Date());
    setStartDate(today);
    setEndDate(today);
    setRange('today');
  };

  const setDateRangeToLast7 = () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    setStartDate(formatDate(start));
    setEndDate(formatDate(today));
    setRange('last7');
  };

  const setDateRangeToLast30 = () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    setStartDate(formatDate(start));
    setEndDate(formatDate(today));
    setRange('last30');
  };

  const setDateRangeToAll = () => {
    setStartDate('');
    setEndDate('');
    setRange('all');
  };

  const handleManualDateChange = () => {
    setRange('custom');
  };

  // Format timestamp for datetime-local input (convert to local time)
  const formatForInput = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp.replace(' ', 'T'));
    if (Number.isNaN(d.valueOf())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  // Convert datetime-local input to ISO format for backend
  const formatForBackend = (localString) => {
    if (!localString) return '';
    // Add seconds: "YYYY-MM-DDTHH:mm:ss"
    return localString + ':00';
  };

  const computeRange = () => {
    if (range === 'all') {
      return { start: undefined, end: undefined };
    }
    // Use state values if they exist
    return { start: startDate || undefined, end: endDate || undefined };
  };

  const validateSessionTimes = (checkInStr, checkOutStr) => {
    if (!checkInStr) return 'Check-in is required';
    const checkIn = new Date(checkInStr);
    if (Number.isNaN(checkIn.valueOf())) return 'Enter valid check-in date/time';
    if (checkOutStr) {
      const checkOut = new Date(checkOutStr);
      if (Number.isNaN(checkOut.valueOf())) return 'Enter valid check-out date/time';
      if (checkOut <= checkIn) return 'Check-out must be after check-in';
      const hours = (checkOut - checkIn) / (1000 * 60 * 60);
      if (hours > 12) return 'Session cannot exceed 12 hours';
    }
    return null;
  };

  const fetchSessions = async () => {
    if (selectedUsers.length === 0) {
      setSessions([]);
      return;
    }
    setLoading(true);
    setError('');
    const { start, end } = computeRange();
    try {
      const res = await attendanceApi.getByRange(start, end, selectedUsers);
      setSessions(res.data);
    } catch (err) {
      setError('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (id) => {
    setSelectedUsers((prev) => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
  };

  const toggleAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const fetchAuditLog = async (sessionId) => {
    try {
      const response = await api.get(`/attendance/${sessionId}/audit-log`);
      setAuditLogs(prev => ({ ...prev, [sessionId]: response.data.logs || [] }));
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
    }
  };

  const toggleExpandSession = async (sessionId) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
    } else {
      setExpandedSessionId(sessionId);
      if (!auditLogs[sessionId]) {
        await fetchAuditLog(sessionId);
      }
    }
  };

  const startEdit = (session) => {
    setEditSessionId(session.id);
    setEditForm({
      checkInTime: formatForInput(session.check_in_time),
      checkOutTime: formatForInput(session.check_out_time),
      reflectionText: session.reflection_text || '',
      auditReason: '',
    });
  };

  const cancelEdit = () => {
    setEditSessionId(null);
    setEditForm({ checkInTime: '', checkOutTime: '', reflectionText: '', auditReason: '' });
  };

  const saveEdit = async () => {
    if (!editSessionId) return;
    if (!editForm.auditReason) {
      setError('Audit reason is required');
      return;
    }
    const validationError = validateSessionTimes(editForm.checkInTime, editForm.checkOutTime);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      const payload = {
        checkInTime: formatForBackend(editForm.checkInTime),
        reflectionText: editForm.reflectionText,
        auditReason: editForm.auditReason,
      };
      if (editForm.checkOutTime) {
        payload.checkOutTime = formatForBackend(editForm.checkOutTime);
      }
      await attendanceApi.adminUpdate(editSessionId, payload);
      cancelEdit();
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes');
    }
  };

  const handleDelete = async (sessionId) => {
    const reason = prompt('Provide an audit reason for delete:');
    if (!reason) return;
    try {
      await attendanceApi.adminDelete(sessionId, reason);
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.auditReason) {
      setError('Audit reason is required');
      return;
    }
    const validationError = validateSessionTimes(createForm.checkInTime, createForm.checkOutTime);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      await attendanceApi.adminCreate({
        userId: createForm.userId,
        checkInTime: formatForBackend(createForm.checkInTime),
        checkOutTime: formatForBackend(createForm.checkOutTime),
        reflectionText: createForm.reflectionText,
        auditReason: createForm.auditReason,
      });
      setCreateForm({ userId: '', checkInTime: '', checkOutTime: '', reflectionText: '', auditReason: '' });
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create session');
    }
  };

  const handleQuickCheckUserChange = async (userId) => {
    setQuickCheckUserId(userId);
    setQuickCheckStatus(null);
    setQuickCheckInTime('');
    setQuickCheckOutTime('');
    setActiveSessionCheckInTime(null);
    setError('');
    
    if (!userId) return;
    
    try {
      const response = await attendanceApi.getUserStatus(userId);
      setQuickCheckStatus(response.data.checkedIn ? 'checked-in' : 'checked-out');
      if (response.data.checkedIn && response.data.session) {
        setActiveSessionCheckInTime(response.data.session.check_in_time);
      }
    } catch (err) {
      setError('Failed to check status');
    }
  };

  const handleQuickCheckIn = async () => {
    if (!quickCheckUserId) {
      setError('Please select a user');
      return;
    }
    if (!quickCheckInTime) {
      setError('Please select a check-in time');
      return;
    }
    
    // Combine today's date with the selected time (keep as local time string)
    const today = new Date();
    const localDateStr = `${formatDate(today)}T${quickCheckInTime}`; // YYYY-MM-DDTHH:mm
    const checkInDateTime = new Date(localDateStr);
    const now = new Date();
    if (checkInDateTime > now) {
      setError('Cannot enter a future time');
      return;
    }
    
    try {
      const response = await attendanceApi.quickCheckIn(quickCheckUserId, formatForBackend(localDateStr), 'Admin quick check-in');
      setQuickCheckInTime('');
      setQuickCheckStatus('checked-in');
      setActiveSessionCheckInTime(response.data.session.check_in_time);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check in');
    }
  };

  const handleQuickCheckOut = async () => {
    if (!quickCheckUserId) {
      setError('Please select a user');
      return;
    }
    if (!quickCheckOutTime) {
      setError('Please select a check-out time');
      return;
    }
    
    // Combine today's date with the selected time (keep as local time string)
    const today = new Date();
    const localDateStr = `${formatDate(today)}T${quickCheckOutTime}`;
    const checkOutDateTime = new Date(localDateStr);
    const now = new Date();
    if (checkOutDateTime > now) {
      setError('Cannot enter a future time');
      return;
    }
    
    try {
      await attendanceApi.quickCheckOut(quickCheckUserId, formatForBackend(localDateStr), 'Admin quick check-out');
      setQuickCheckOutTime('');
      setQuickCheckStatus('checked-out');
      setActiveSessionCheckInTime(null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check out');
    }
  };

  const formatDateTime = (dt) => {
    if (!dt) return '';
    // Backend returns timestamps in local time format: "2026-01-08 14:00:00" or "2026-01-08T14:00:00"
    return new Date(dt.replace(' ', 'T')).toLocaleString();
  };

  return (
    <div className="tab-content attendance-tab">
      <div className="attendance-header">
        <h2>Attendance Management</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="date-selector">
        <div className="date-tools-left">
          <div className="date-quick-buttons">
            <button 
              className={`btn btn-sm ${range === 'today' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={setDateRangeToToday}
            >
              Today
            </button>
            <button 
              className={`btn btn-sm ${range === 'last7' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={setDateRangeToLast7}
            >
              Last 7 Days
            </button>
            <button 
              className={`btn btn-sm ${range === 'last30' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={setDateRangeToLast30}
            >
              Last 30 Days
            </button>
            <button 
              className={`btn btn-sm ${range === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={setDateRangeToAll}
            >
              All Time
            </button>
          </div>
          <div className="date-manual-inputs">
            <label>
              Start Date:
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => { setStartDate(e.target.value); handleManualDateChange(); }}
              />
            </label>
            <label>
              End Date:
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => { setEndDate(e.target.value); handleManualDateChange(); }}
              />
            </label>
          </div>
        </div>
        <div className="date-tools-right">
          <button className="btn btn-secondary" onClick={() => setShowQuickCheck(!showQuickCheck)}>
            {showQuickCheck ? 'Hide Quick Check In/Out' : 'Quick Check In/Out'}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowAddSession(!showAddSession)}>
            {showAddSession ? 'Hide Add Session' : '+ Add Session'}
          </button>
          <button className="btn btn-primary" onClick={fetchSessions} disabled={loading} style={{ border: '2px solid #000' }}>
            {loading ? 'Loading...' : 'Load Attendance Sessions'}
          </button>
        </div>
      </div>

      <div className="attendance-layout">
        <div className="user-list">
          <h3>People</h3>
          <label className="user-checkbox select-all">
            <input 
              type="checkbox" 
              checked={selectedUsers.length === users.length && users.length > 0}
              onChange={toggleAllUsers}
            />
            <strong>Check/Uncheck All</strong>
          </label>
          <div className="user-list-body">
            {users.map(u => (
              <label key={u.id} className="user-checkbox">
                <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggleUser(u.id)} />
                <span className={`role-badge role-${u.role}`}></span>
                {u.alias} - {u.first_name} {u.last_name}
              </label>
            ))}
          </div>
          <div className="user-list-footer">
            <p>Selected {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="attendance-main">
          {showQuickCheck && (
          <div className="create-session">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>User Checkin/Checkout for Today</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowQuickCheck(false)}>Close</button>
            </div>
            <div className="quick-check-form">
              <select value={quickCheckUserId} onChange={(e) => handleQuickCheckUserChange(e.target.value)}>
                <option value="">Select user</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.alias} ({u.role})</option>
                ))}
              </select>
              
              {quickCheckStatus && (
                <div style={{ marginTop: '10px' }}>
                  {quickCheckStatus === 'checked-out' ? (
                    <>
                      <p style={{ marginBottom: '10px', color: '#28a745', fontWeight: 'bold' }}>Status: Checked Out</p>
                      <div>
                        <label>Check In Time:</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input type="time" value={quickCheckInTime} onChange={(e) => setQuickCheckInTime(e.target.value)} />
                          <button onClick={handleQuickCheckIn} className="btn btn-sm btn-success" disabled={!quickCheckInTime}>Check In</button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p style={{ marginBottom: '10px', color: '#007bff', fontWeight: 'bold' }}>
                        Status: Checked In at {activeSessionCheckInTime ? new Date(activeSessionCheckInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                      </p>
                      <div>
                        <label>Check Out Time:</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input type="time" value={quickCheckOutTime} onChange={(e) => setQuickCheckOutTime(e.target.value)} />
                          <button onClick={handleQuickCheckOut} className="btn btn-sm btn-danger" disabled={!quickCheckOutTime}>Check Out</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          )}

          {showAddSession && (
          <div className="create-session" style={{ marginTop: showQuickCheck ? '30px' : '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Add Session</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowAddSession(false)}>Close</button>
            </div>
            <form onSubmit={handleCreate} className="create-form">
              <select value={createForm.userId} onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })} required>
                <option value="">Select user</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.alias} ({u.role})</option>
                ))}
              </select>
              <input type="datetime-local" value={createForm.checkInTime} onChange={(e) => setCreateForm({ ...createForm, checkInTime: e.target.value })} required />
              <input type="datetime-local" value={createForm.checkOutTime} onChange={(e) => setCreateForm({ ...createForm, checkOutTime: e.target.value })} required />
              <input type="text" placeholder="Reflection (optional)" value={createForm.reflectionText} onChange={(e) => setCreateForm({ ...createForm, reflectionText: e.target.value })} />
              <input type="text" placeholder="Audit reason (required)" value={createForm.auditReason} onChange={(e) => setCreateForm({ ...createForm, auditReason: e.target.value })} required />
              <button type="submit" className="btn btn-success btn-sm">Create</button>
            </form>
          </div>
          )}

          {/* Editor panel */}
          {editSessionId && (
            <div style={{
              background: '#f9f9f9',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              padding: '1rem',
              marginBottom: '1rem',
              marginTop: '1rem'
            }}>
              <h3 style={{ marginTop: 0 }}>Edit Attendance Session</h3>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                <strong>{sessions.find(s => s.id === editSessionId)?.alias}</strong> ({sessions.find(s => s.id === editSessionId)?.role})
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '0.75rem', alignItems: 'start' }}>
                <div>
                  <label>Check In Time</label>
                  <input 
                    type="datetime-local" 
                    value={editForm.checkInTime} 
                    onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })} 
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label>Check Out Time</label>
                  <input 
                    type="datetime-local" 
                    value={editForm.checkOutTime} 
                    onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })} 
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label>Reflection</label>
                  <textarea 
                    value={editForm.reflectionText} 
                    onChange={(e) => setEditForm({ ...editForm, reflectionText: e.target.value })} 
                    rows={3} 
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }} 
                  />
                </div>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <label>Audit Reason (required)</label>
                <input
                  type="text"
                  value={editForm.auditReason}
                  onChange={(e) => setEditForm({ ...editForm, auditReason: e.target.value })}
                  placeholder="Describe why this change is needed"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button className="btn btn-success" onClick={saveEdit} disabled={deleting}>
                  Save Changes
                </button>
                <button className="btn btn-secondary" onClick={cancelEdit} disabled={deleting}>
                  Cancel
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={async () => {
                    if (!editSessionId) return;
                    const ok = window.confirm('Are you sure you want to delete this attendance session?');
                    if (!ok) return;
                    try {
                      setDeleting(true);
                      await attendanceApi.adminDelete(editSessionId, 'Deleted via admin panel');
                      setEditSessionId(null);
                      setEditForm({ checkInTime: '', checkOutTime: '', reflectionText: '', auditReason: '' });
                      await fetchSessions();
                      // Refresh quick-check status for the currently selected user
                      if (quickCheckUserId) {
                        await handleQuickCheckUserChange(quickCheckUserId);
                      } else {
                        setQuickCheckStatus(null);
                        setActiveSessionCheckInTime(null);
                      }
                    } catch (err) {
                      setError(err.response?.data?.error || 'Failed to delete session');
                    } finally {
                      setDeleting(false);
                    }
                  }} 
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading attendance...</div>
          ) : sessions.length === 0 ? (
            <div className="no-data">No sessions for the selected criteria.</div>
          ) : (
            <table className="attendance-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Edit</th>
                  <th>User</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th style={{ textAlign: 'center', width: '40px' }}>Audit</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <React.Fragment key={s.id}>
                    <tr>
                      <td style={{ width: '50px', padding: '2px' }}>
                        <button 
                          className="btn btn-sm btn-info" 
                          onClick={() => startEdit(s)}
                          style={{ fontSize: '0.7rem', padding: '1px 4px', whiteSpace: 'nowrap' }}
                        >
                          Edit
                        </button>
                      </td>
                      <td>{s.alias} ({s.role})</td>
                      <td>{formatDateTime(s.check_in_time)}</td>
                      <td>{formatDateTime(s.check_out_time)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-sm"
                          onClick={() => toggleExpandSession(s.id)}
                          style={{ fontSize: '0.75rem', padding: '2px 6px' }}
                        >
                          {expandedSessionId === s.id ? '▼' : '▶'}
                        </button>
                      </td>
                    </tr>
                    {expandedSessionId === s.id && (
                      <tr>
                        <td colSpan="5" style={{ padding: '0.75rem', background: '#f9f9f9' }}>
                          <div>
                            <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Audit History</h4>
                            {auditLogs[s.id] && auditLogs[s.id].length > 0 ? (
                              <div style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
                                {auditLogs[s.id].map((log, logIdx) => {
                                  const actionLabel = (log.action || log.action_type || 'AUDIT').toString().toUpperCase();
                                  return (
                                  <div key={logIdx} style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e0e0e0' }}>
                                    <div><strong>{actionLabel}</strong> by {log.user_alias || log.actor_alias || 'Unknown'} on {new Date(log.created_at).toLocaleString()}</div>
                                    {log.changes && (
                                      <div style={{ color: '#666', marginTop: '0.25rem' }}>
                                        {typeof log.changes === 'string' ? (
                                          <pre style={{ margin: 0, fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                            {JSON.stringify(JSON.parse(log.changes), null, 2)}
                                          </pre>
                                        ) : (
                                          <pre style={{ margin: 0, fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                            {JSON.stringify(log.changes, null, 2)}
                                          </pre>
                                        )}
                                      </div>
                                    )}
                                    {log.reason && (
                                      <div style={{ color: '#555', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                        Reason: {log.reason}
                                      </div>
                                    )}
                                  </div>
                                );
                                })}
                              </div>
                            ) : (
                              <p style={{ color: '#666', fontSize: '0.85rem' }}>No audit history available.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function ReflectionsTab() {
  return (
    <div className="tab-content">
      <h2>Reflections</h2>
      <p>Reflections viewer will be implemented here.</p>
      <p>Features:</p>
      <ul>
        <li>View all reflections</li>
        <li>Filter by user</li>
        <li>Filter by date range</li>
      </ul>
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [presenceStart, setPresenceStart] = useState(8);
  const [presenceEnd, setPresenceEnd] = useState(24);
  const [colorStudentCheckedIn, setColorStudentCheckedIn] = useState('#48bb78');
  const [colorMentorCheckedIn, setColorMentorCheckedIn] = useState('#4299e1');
  const [colorNotCheckedIn, setColorNotCheckedIn] = useState('#a0aec0');
  const [colorPastSession, setColorPastSession] = useState('#4fd1c5');
  const [colorActiveSession, setColorActiveSession] = useState('#f6e05e');
  const [colorCurrentTime, setColorCurrentTime] = useState('#ff6b6b');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsApi.get();
      setSettings(response.data);
      setPrompt(response.data.reflection_prompt);
      if (response.data.presence_start_hour !== undefined) {
        setPresenceStart(response.data.presence_start_hour);
      }
      if (response.data.presence_end_hour !== undefined) {
        setPresenceEnd(response.data.presence_end_hour);
      }
      if (response.data.color_student_checked_in) {
        setColorStudentCheckedIn(response.data.color_student_checked_in);
      }
      if (response.data.color_mentor_checked_in) {
        setColorMentorCheckedIn(response.data.color_mentor_checked_in);
      }
      if (response.data.color_not_checked_in) {
        setColorNotCheckedIn(response.data.color_not_checked_in);
      }
      if (response.data.color_past_session) {
        setColorPastSession(response.data.color_past_session);
      }
      if (response.data.color_active_session) {
        setColorActiveSession(response.data.color_active_session);
      }
      if (response.data.color_current_time) {
        setColorCurrentTime(response.data.color_current_time);
      }
    } catch (err) {
      setError('Failed to load settings: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setError('');
    if (Number(presenceStart) >= Number(presenceEnd)) {
      setError('Presence start hour must be less than end hour');
      return;
    }
    try {
      await settingsApi.update({
        reflectionPrompt: prompt,
        presenceStartHour: Number(presenceStart),
        presenceEndHour: Number(presenceEnd),
        colorStudentCheckedIn,
        colorMentorCheckedIn,
        colorNotCheckedIn,
        colorPastSession,
        colorActiveSession,
        colorCurrentTime,
      });
      alert('Settings updated successfully');
      fetchSettings();
    } catch (err) {
      setError('Failed to update settings: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="tab-content">
      <h2>System Settings</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && <div className="loading">Loading settings...</div>}

      {!loading && settings && (
        <form onSubmit={handleUpdateSettings} className="settings-form">
          <div className="form-group">
            <label>Reflection Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows="4"
              placeholder="Enter the reflection prompt for students"
            />
          </div>

          <div className="form-group">
            <label>Presence Timeline Start Hour (0-23)</label>
            <input
              type="number"
              min="0"
              max="23"
              value={presenceStart}
              onChange={(e) => setPresenceStart(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Presence Timeline End Hour (1-24)</label>
            <input
              type="number"
              min="1"
              max="24"
              value={presenceEnd}
              onChange={(e) => setPresenceEnd(e.target.value)}
            />
          </div>

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Presence Board Colors</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div className="form-group">
              <label>Student Checked In</label>
              <input
                type="color"
                value={colorStudentCheckedIn}
                onChange={(e) => setColorStudentCheckedIn(e.target.value)}
                style={{ width: '100%', height: '40px', cursor: 'pointer' }}
              />
            </div>

            <div className="form-group">
              <label>Mentor/Coach Checked In</label>
              <input
                type="color"
                value={colorMentorCheckedIn}
                onChange={(e) => setColorMentorCheckedIn(e.target.value)}
                style={{ width: '100%', height: '40px', cursor: 'pointer' }}
              />
            </div>

            <div className="form-group">
              <label>Not Checked In</label>
              <input
                type="color"
                value={colorNotCheckedIn}
                onChange={(e) => setColorNotCheckedIn(e.target.value)}
                style={{ width: '100%', height: '40px', cursor: 'pointer' }}
              />
            </div>

            <div className="form-group">
              <label>Past Session Bar</label>
              <input
                type="color"
                value={colorPastSession}
                onChange={(e) => setColorPastSession(e.target.value)}
                style={{ width: '100%', height: '40px', cursor: 'pointer' }}
              />
            </div>

            <div className="form-group">
              <label>Active Session Bar</label>
              <input
                type="color"
                value={colorActiveSession}
                onChange={(e) => setColorActiveSession(e.target.value)}
                style={{ width: '100%', height: '40px', cursor: 'pointer' }}
              />
            </div>

            <div className="form-group">
              <label>Current Time Marker</label>
              <input
                type="color"
                value={colorCurrentTime}
                onChange={(e) => setColorCurrentTime(e.target.value)}
                style={{ width: '100%', height: '40px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success">
              Save Settings
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function TestingTab() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const triggerCoreHoursChecker = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await api.post('/admin/test-core-hours-checker', {});
      setMessage('✓ Core hours compliance check completed successfully');
      console.log('Response:', response.data);
    } catch (err) {
      setError('Failed to run core hours checker: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const triggerMidnightCheckout = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await api.post('/admin/midnight-checkout', {});
      setMessage('✓ Midnight checkout process completed successfully');
      console.log('Response:', response.data);
    } catch (err) {
      setError('Failed to run midnight checkout: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="testing-tab">
      <h2>Testing & Diagnostics</h2>
      <p>Manually trigger cron jobs and system tasks for testing purposes.</p>

      <div className="testing-section">
        <h3>Scheduled Tasks</h3>

        <div className="testing-card">
          <h4>Core Hours Compliance Checker</h4>
          <p>Checks if students met core hours requirements and creates absence records for those who didn't.</p>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Runs every 15 minutes at:
          </p>
          <code style={{ background: '#f0f0f0', padding: '0.5rem', borderRadius: '4px', display: 'block', marginBottom: '1rem' }}>
            */15 * * * * (every 15 minutes)
          </code>
          <button
            className="btn btn-primary"
            onClick={triggerCoreHoursChecker}
            disabled={loading}
            style={{ marginBottom: '1rem' }}
          >
            {loading ? 'Running...' : 'Run Core Hours Checker Now'}
          </button>
        </div>

        <div className="testing-card">
          <h4>Midnight Auto-Checkout</h4>
          <p>Automatically checks out any users still on site after 2 AM.</p>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Runs daily at:
          </p>
          <code style={{ background: '#f0f0f0', padding: '0.5rem', borderRadius: '4px', display: 'block', marginBottom: '1rem' }}>
            0 2 * * * (2:00 AM daily)
          </code>
          <button
            className="btn btn-primary"
            onClick={triggerMidnightCheckout}
            disabled={loading}
            style={{ marginBottom: '1rem' }}
          >
            {loading ? 'Running...' : 'Run Midnight Checkout Now'}
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '1rem',
          marginTop: '1rem',
          background: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem',
          marginTop: '1rem',
          background: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

function AbsencesTab() {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateRange, setDateRange] = useState('week');
  const [records, setRecords] = useState([]);
  const [loadingAbsences, setLoadingAbsences] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editStatus, setEditStatus] = useState('unapproved');
  const [editNotes, setEditNotes] = useState('');
  const [editAuditReason, setEditAuditReason] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState(null);
  const [auditLogs, setAuditLogs] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStudentId, setAddStudentId] = useState('');
  const [addDate, setAddDate] = useState('');
  const [addStatus, setAddStatus] = useState('unapproved');
  const [addNotes, setAddNotes] = useState('');
  const [savingAdd, setSavingAdd] = useState(false);

  useEffect(() => {
    loadStudentsAndInitialize();
  }, []);

  const loadStudentsAndInitialize = async () => {
    try {
      const res = await userApi.getAll();
      const studentsList = res.data.filter(u => u.role === 'student');
      setStudents(studentsList);
      // Select all students by default
      setSelectedStudents(studentsList.map(s => s.id));
      // Set date range to this week
      setDateRangeToThisWeek();
      // Auto-load absences after a brief delay to ensure state is set
      setTimeout(() => {
        loadAbsencesInitial(studentsList);
      }, 100);
    } catch (err) {
      setError('Failed to load students');
    }
  };

  const loadAbsencesInitial = async (studentsList) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek);
    const end = new Date(today);
    end.setDate(today.getDate() + (6 - dayOfWeek));
    const startDateStr = formatDate(start);
    const endDateStr = formatDate(end);

    try {
      setLoadingAbsences(true);
      const requests = studentsList.map(s => (
        api.get(`/absences/student/${s.id}`, { params: { startDate: startDateStr, endDate: endDateStr } })
          .then(res => ({ id: s.id, rows: res.data || [] }))
      ));
      const results = await Promise.all(requests);
      const aggregated = [];
      results.forEach(({ id, rows }) => {
        const student = studentsList.find(s => s.id === id);
        rows.forEach(r => {
          aggregated.push({
            studentId: id,
            studentName: `${student?.first_name || ''} ${student?.last_name || ''}`.trim(),
            studentAlias: student?.alias || '',
            absenceDate: r.absence_date,
            status: r.status,
            notes: r.notes || '',
            recordId: r.id,
          });
        });
      });
      aggregated.sort((a, b) => {
        const nameCmp = a.studentName.localeCompare(b.studentName);
        if (nameCmp !== 0) return nameCmp;
        return new Date(a.absenceDate) - new Date(b.absenceDate);
      });
      setRecords(aggregated);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load absences');
    } finally {
      setLoadingAbsences(false);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await userApi.getAll();
      setStudents(res.data.filter(u => u.role === 'student'));
    } catch (err) {
      setError('Failed to load students');
    }
  };

  const toggleStudent = (id) => {
    setSelectedStudents((prev) => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const getStudentById = (id) => students.find(s => s.id === id);

  const toggleAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const setDateRangeToToday = () => {
    const today = formatDate(new Date());
    setStartDate(today);
    setEndDate(today);
    setDateRange('today');
  };

  const setDateRangeToTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDate(tomorrow);
    setStartDate(tomorrowStr);
    setEndDate(tomorrowStr);
    setDateRange('tomorrow');
  };

  const setDateRangeToThisWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek);
    const end = new Date(today);
    end.setDate(today.getDate() + (6 - dayOfWeek));
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
    setDateRange('week');
  };

  const setDateRangeToThisMonth = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
    setDateRange('month');
  };

  const handleManualDateChange = () => {
    setDateRange('custom');
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
    if (Number.isNaN(d.valueOf())) return dateString;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const fetchAuditLog = async (recordId) => {
    try {
      const response = await api.get(`/absences/${recordId}/audit-log`);
      setAuditLogs(prev => ({ ...prev, [recordId]: response.data.logs || [] }));
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
    }
  };

  const toggleExpandRecord = async (recordId) => {
    if (expandedRecordId === recordId) {
      setExpandedRecordId(null);
    } else {
      setExpandedRecordId(recordId);
      if (!auditLogs[recordId]) {
        await fetchAuditLog(recordId);
      }
    }
  };

  const loadAbsences = async () => {
    setError('');
    setRecords([]);
    if (!startDate || !endDate) {
      setError('Please select a start and end date');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be before end date');
      return;
    }
    if (selectedStudents.length === 0) {
      // No students selected: nothing to load
      setRecords([]);
      return;
    }
    try {
      setLoadingAbsences(true);
      const requests = selectedStudents.map(id => (
        api.get(`/absences/student/${id}`, { params: { startDate, endDate } })
          .then(res => ({ id, rows: res.data || [] }))
      ));
      const results = await Promise.all(requests);
      const aggregated = [];
      results.forEach(({ id, rows }) => {
        const student = getStudentById(id);
        rows.forEach(r => {
          aggregated.push({
            studentId: id,
            studentName: `${student?.first_name || ''} ${student?.last_name || ''}`.trim(),
            studentAlias: student?.alias || '',
            absenceDate: r.absence_date,
            status: r.status,
            notes: r.notes || '',
            recordId: r.id,
          });
        });
      });
      // Sort by student name, then by absence date (ascending)
      aggregated.sort((a, b) => {
        const nameCmp = a.studentName.localeCompare(b.studentName);
        if (nameCmp !== 0) return nameCmp;
        return new Date(a.absenceDate) - new Date(b.absenceDate);
      });
      setRecords(aggregated);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load absences');
    } finally {
      setLoadingAbsences(false);
    }
  };

  const handleAddAbsence = async () => {
    setError('');
    if (!addStudentId) {
      setError('Please select a student');
      return;
    }
    if (!addDate) {
      setError('Please select a date');
      return;
    }
    try {
      setSavingAdd(true);
      const dateObj = new Date(`${addDate}T00:00:00`);
      const dayOfWeek = dateObj.getDay(); // Returns 0-6 (Sunday-Saturday)
      await api.post('/absences', {
        studentId: addStudentId,
        absenceDate: addDate,
        dayOfWeek: dayOfWeek,
        status: addStatus,
        notes: addNotes,
      });
      setShowAddModal(false);
      setAddStudentId('');
      setAddDate('');
      setAddStatus('unexcused');
      setAddNotes('');
      setError('');
      // Reload the records if any students are selected
      if (selectedStudents.length > 0) {
        await loadAbsences();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add absence');
    } finally {
      setSavingAdd(false);
    }
  };

  return (
    <div className="tab-content absence-tab">
      <div className="absence-header">
        <h2>Absence Management</h2>
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}

      {/* Add Absence Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginTop: 0 }}>Add New Absence</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Student:
              </label>
              <select 
                value={addStudentId}
                onChange={(e) => setAddStudentId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              >
                <option value="">-- Select Student --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} ({s.alias})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Date:
              </label>
              <input 
                type="date"
                value={addDate}
                onChange={(e) => setAddDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Status:
              </label>
              <select 
                value={addStatus}
                onChange={(e) => setAddStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              >
                <option value="unapproved">Unapproved</option>
                <option value="approved">Approved</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Notes:
              </label>
              <textarea 
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  minHeight: '80px',
                  fontFamily: 'inherit'
                }}
                placeholder="Optional notes..."
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddModal(false);
                  setAddStudentId('');
                  setAddDate('');
                  setAddStatus('unapproved');
                  setAddNotes('');
                }}
                disabled={savingAdd}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAddAbsence}
                disabled={savingAdd}
              >
                {savingAdd ? 'Saving...' : 'Add Absence'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="date-selector">
        <div className="date-tools-left">
          <div className="date-quick-buttons">
            <button 
              className={`btn btn-sm ${dateRange === 'today' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={setDateRangeToToday}
            >
              Today
            </button>
            <button 
              className={`btn btn-sm ${dateRange === 'tomorrow' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={setDateRangeToTomorrow}
            >
              Tomorrow
            </button>
            <button 
              className={`btn btn-sm ${dateRange === 'week' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={setDateRangeToThisWeek}
            >
              This Week
            </button>
            <button 
              className={`btn btn-sm ${dateRange === 'month' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={setDateRangeToThisMonth}
            >
              This Month
            </button>
          </div>
          <div className="date-manual-inputs">
            <label>
              Start Date:
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => { setStartDate(e.target.value); handleManualDateChange(); }}
              />
            </label>
            <label>
              End Date:
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => { setEndDate(e.target.value); handleManualDateChange(); }}
              />
            </label>
          </div>
        </div>
        <div className="date-tools-right">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Absence
          </button>
          <button className="btn btn-primary" onClick={loadAbsences} disabled={loadingAbsences} style={{ border: '2px solid #000' }}>
            {loadingAbsences ? 'Loading...' : 'Load Absences'}
          </button>
        </div>
      </div>

      <div className="absence-layout">
        <div className="user-list">
          <h3>Students</h3>
          <label className="user-checkbox select-all">
            <input 
              type="checkbox" 
              checked={selectedStudents.length === students.length && students.length > 0}
              onChange={toggleAllStudents}
            />
            <strong>Check/Uncheck All</strong>
          </label>
          <div className="user-list-body">
            {students.map(s => (
              <label key={s.id} className="user-checkbox">
                <input 
                  type="checkbox" 
                  checked={selectedStudents.includes(s.id)} 
                  onChange={() => toggleStudent(s.id)} 
                />
                {s.alias} - {s.first_name} {s.last_name}
              </label>
            ))}
          </div>
          <div className="user-list-footer">
            <p>Selected {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="absence-main">
          {/* Editor panel */}
          {editingRecord && (
            <div style={{
              background: '#f9f9f9',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <h3 style={{ marginTop: 0 }}>Edit Absence</h3>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                <strong>{editingRecord.studentName}</strong> ({editingRecord.studentAlias}) — {formatDateForDisplay(editingRecord.absenceDate)}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', alignItems: 'start' }}>
                <div>
                  <label>Status</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}>
                    <option value="unapproved">Unapproved</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
                <div>
                  <label>Notes</label>
                  <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }} />
                </div>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <label>Audit Reason (required)</label>
                <input
                  type="text"
                  value={editAuditReason}
                  onChange={(e) => setEditAuditReason(e.target.value)}
                  placeholder="Describe why this change is needed"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button className="btn btn-success" onClick={async () => {
                  if (!editingRecord) return;
                  if (!editAuditReason.trim()) {
                    setError('Audit reason is required');
                    return;
                  }
                  try {
                    setSavingEdit(true);
                    await api.put(`/absences/${editingRecord.recordId}`, {
                      status: editStatus,
                      notes: editNotes,
                      approvedBy: editStatus === 'approved' ? localStorage.getItem('userId') : null,
                      auditReason: editAuditReason.trim()
                    });
                    setEditingRecord(null);
                    setEditStatus('unapproved');
                    setEditNotes('');
                    setEditAuditReason('');
                    await loadAbsences();
                  } catch (err) {
                    setError(err.response?.data?.error || 'Failed to save changes');
                  } finally {
                    setSavingEdit(false);
                  }
                }} disabled={savingEdit || deleting}>
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-secondary" onClick={() => {
                  setEditingRecord(null);
                  setEditStatus('unapproved');
                  setEditNotes('');
                  setEditAuditReason('');
                }}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={async () => {
                  if (!editingRecord) return;
                  const ok = window.confirm('Are you sure you want to delete this absence record?');
                  if (!ok) return;
                  try {
                    setDeleting(true);
                    await api.delete(`/absences/${editingRecord.recordId}`);
                    setEditingRecord(null);
                    setEditStatus('unapproved');
                    setEditNotes('');
                    setEditAuditReason('');
                    await loadAbsences();
                  } catch (err) {
                    setError(err.response?.data?.error || 'Failed to delete record');
                  } finally {
                    setDeleting(false);
                  }
                }} disabled={savingEdit || deleting}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )}

          

          {/* Records viewer */}
          {loadingAbsences && <div className="loading">Loading absences...</div>}
          {!loadingAbsences && records.length === 0 && (
            <div className="no-data">No absences to display</div>
          )}
          {!loadingAbsences && records.length > 0 && (
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Edit</th>
                  <th>Student Name</th>
                  <th>Student Alias</th>
                  <th>Absence Date</th>
                  <th>Status</th>
                  <th className="notes-cell">Notes</th>
                  <th style={{ textAlign: 'center', width: '40px' }}>Audit</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, idx) => (
                  <React.Fragment key={`${rec.studentId}-${rec.absenceDate}-${idx}`}>
                    <tr>
                      <td>
                        <button className="btn btn-sm btn-info" onClick={() => {
                          setEditingRecord(rec);
                          setEditStatus(rec.status || 'unapproved');
                          setEditNotes(rec.notes || '');
                          setEditAuditReason('');
                        }}>
                          Edit
                        </button>
                      </td>
                      <td>{rec.studentName}</td>
                      <td>{rec.studentAlias}</td>
                      <td>{formatDateForDisplay(rec.absenceDate)}</td>
                      <td>{rec.status}</td>
                      <td className="notes-cell" title={rec.notes}>{rec.notes}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-sm"
                          onClick={() => toggleExpandRecord(rec.recordId)}
                          style={{ fontSize: '0.75rem', padding: '2px 6px' }}
                        >
                          {expandedRecordId === rec.recordId ? '▼' : '▶'}
                        </button>
                      </td>
                    </tr>
                    {expandedRecordId === rec.recordId && (
                      <tr>
                        <td colSpan="7" style={{ padding: '0.75rem', background: '#f9f9f9' }}>
                          <div>
                            <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Audit History</h4>
                            {auditLogs[rec.recordId] && auditLogs[rec.recordId].length > 0 ? (
                              <div style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
                                {auditLogs[rec.recordId].map((log, logIdx) => (
                                  <div key={logIdx} style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e0e0e0' }}>
                                    <div><strong>{log.action.toUpperCase()}</strong> by {log.user_alias} on {new Date(log.created_at).toLocaleString()}</div>
                                    {log.changes && (
                                      <div style={{ color: '#666', marginTop: '0.25rem' }}>
                                        {typeof log.changes === 'string' ? (
                                          <pre style={{ margin: 0, fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                            {JSON.stringify(JSON.parse(log.changes), null, 2)}
                                          </pre>
                                        ) : (
                                          <pre style={{ margin: 0, fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                            {JSON.stringify(log.changes, null, 2)}
                                          </pre>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ color: '#999' }}>No audit history</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

