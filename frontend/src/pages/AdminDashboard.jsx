import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userApi, settingsApi, contactApi, attendanceApi } from '../services/api';
import './AdminDashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
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
            className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`nav-tab ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            Contacts
          </button>
          <button
            className={`nav-tab ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            Attendance
          </button>
          <button
            className={`nav-tab ${activeTab === 'reflections' ? 'active' : ''}`}
            onClick={() => setActiveTab('reflections')}
          >
            Reflections
          </button>
          {userRole === 'coach' && (
            <button
              className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          )}
        </nav>

        <div className="dashboard-content">
          {activeTab === 'users' && <UsersTab userRole={userRole} />}
          {activeTab === 'contacts' && <ContactsTab userRole={userRole} />}
          {activeTab === 'attendance' && <AttendanceTab />}
          {activeTab === 'reflections' && <ReflectionsTab />}
          {userRole === 'coach' && activeTab === 'settings' && <SettingsTab />}
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

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [range, selectedUsers]);

  const loadUsers = async () => {
    try {
      const res = await userApi.getAll();
      setUsers(res.data.filter(u => u.role === 'student' || u.role === 'mentor'));
    } catch (err) {
      setError('Failed to load users');
    }
  };

  const computeRange = () => {
    const today = new Date();
    const format = (d) => d.toISOString().slice(0, 10);
    if (range === 'today') {
      return { start: format(today), end: format(today) };
    }
    if (range === 'last7') {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start: format(start), end: format(today) };
    }
    if (range === 'last30') {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { start: format(start), end: format(today) };
    }
    return { start: undefined, end: undefined }; // all time
  };

  const validateSessionTimes = (checkInStr, checkOutStr) => {
    if (!checkInStr || !checkOutStr) return 'Check-in and check-out are required';
    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);
    if (Number.isNaN(checkIn.valueOf()) || Number.isNaN(checkOut.valueOf())) return 'Enter valid dates/times';
    if (checkOut <= checkIn) return 'Check-out must be after check-in';
    const hours = (checkOut - checkIn) / (1000 * 60 * 60);
    if (hours > 12) return 'Session cannot exceed 12 hours';
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

  const startEdit = (session) => {
    setEditSessionId(session.id);
    setEditForm({
      checkInTime: session.check_in_time ? session.check_in_time.slice(0, 16) : '',
      checkOutTime: session.check_out_time ? session.check_out_time.slice(0, 16) : '',
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
      await attendanceApi.adminUpdate(editSessionId, {
        checkInTime: new Date(editForm.checkInTime).toISOString(),
        checkOutTime: new Date(editForm.checkOutTime).toISOString(),
        reflectionText: editForm.reflectionText,
        auditReason: editForm.auditReason,
      });
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
        checkInTime: new Date(createForm.checkInTime).toISOString(),
        checkOutTime: new Date(createForm.checkOutTime).toISOString(),
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
    
    // Combine today's date with the selected time
    const today = new Date();
    const [hours, minutes] = quickCheckInTime.split(':');
    const checkInDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    const now = new Date();
    if (checkInDateTime > now) {
      setError('Cannot enter a future time');
      return;
    }
    
    try {
      const response = await attendanceApi.quickCheckIn(quickCheckUserId, checkInDateTime.toISOString());
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
    
    // Combine today's date with the selected time
    const today = new Date();
    const [hours, minutes] = quickCheckOutTime.split(':');
    const checkOutDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    const now = new Date();
    if (checkOutDateTime > now) {
      setError('Cannot enter a future time');
      return;
    }
    
    try {
      await attendanceApi.quickCheckOut(quickCheckUserId, checkOutDateTime.toISOString());
      setQuickCheckOutTime('');
      setQuickCheckStatus('checked-out');
      setActiveSessionCheckInTime(null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check out');
    }
  };

  const formatDateTime = (dt) => dt ? new Date(dt).toLocaleString() : '';

  return (
    <div className="tab-content attendance-tab">
      <div className="attendance-header">
        <h2>Attendance Management</h2>
        <div className="range-buttons">
          {[
            { key: 'today', label: 'Today' },
            { key: 'last7', label: 'Last 7 days' },
            { key: 'last30', label: 'Last 30 days' },
            { key: 'all', label: 'All time' },
          ].map(r => (
            <button key={r.key} className={`btn btn-sm ${range === r.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRange(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="attendance-layout">
        <div className="user-list">
          <h3>People</h3>
          <div className="user-list-body">
            {users.map(u => (
              <label key={u.id} className="user-checkbox">
                <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggleUser(u.id)} />
                <span className={`role-badge role-${u.role}`}>{u.role}</span> {u.alias}
              </label>
            ))}
          </div>
        </div>

        <div className="attendance-main">
          <div className="create-session">
            <h3>User Checkin/Checkout for Today</h3>
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

          <div className="create-session" style={{ marginTop: '30px' }}>
            <h3>Add Session</h3>
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

          {loading ? (
            <div className="loading">Loading attendance...</div>
          ) : sessions.length === 0 ? (
            <div className="no-data">No sessions for the selected criteria.</div>
          ) : (
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Reflection</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.alias} ({s.role})</td>
                    <td>
                      {editSessionId === s.id ? (
                        <input type="datetime-local" value={editForm.checkInTime} onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })} />
                      ) : (
                        formatDateTime(s.check_in_time)
                      )}
                    </td>
                    <td>
                      {editSessionId === s.id ? (
                        <input type="datetime-local" value={editForm.checkOutTime} onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })} />
                      ) : (
                        formatDateTime(s.check_out_time)
                      )}
                    </td>
                    <td>
                      {editSessionId === s.id ? (
                        <input type="text" value={editForm.reflectionText} onChange={(e) => setEditForm({ ...editForm, reflectionText: e.target.value })} />
                      ) : (
                        s.reflection_text || ''
                      )}
                    </td>
                    <td className="actions">
                      {editSessionId === s.id ? (
                        <>
                          <input type="text" placeholder="Audit reason" value={editForm.auditReason} onChange={(e) => setEditForm({ ...editForm, auditReason: e.target.value })} />
                          <button className="btn btn-sm btn-success" onClick={saveEdit}>Save</button>
                          <button className="btn btn-sm btn-secondary" onClick={cancelEdit}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-sm btn-info" onClick={() => startEdit(s)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
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

export default AdminDashboard;

