import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userApi, settingsApi, contactApi } from '../services/api';
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
  return (
    <div className="tab-content">
      <h2>Attendance Management</h2>
      <p>Attendance management interface will be implemented here.</p>
      <p>Features:</p>
      <ul>
        <li>View daily attendance</li>
        <li>Correct attendance sessions</li>
        <li>Export attendance data</li>
        <li>View attendance history</li>
      </ul>
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
    } catch (err) {
      setError('Failed to load settings: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await settingsApi.update(prompt);
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

