import React, { useState, useEffect } from 'react';
import { kioskApi } from '../services/api';
import api from '../services/api';
import './KioskPage.css';

function KioskPage({ onAuth }) {
  const [mode, setMode] = useState('select'); // 'select', 'pin-entry'
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await kioskApi.getUsers();
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users');
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setMode('pin-entry');
    setPin('');
    setError(null);
  };

  const handlePinSubmit = async () => {
    if (!pin) {
      setError('Please enter your PIN');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        alias: selectedUser.alias,
        pin: pin,
      });

      const { token, user } = response.data;
      onAuth(token, user);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid PIN');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const resetToHome = () => {
    setMode('select');
    setSelectedUser(null);
    setPin('');
    setError(null);
    setSearchTerm('');
  };

  const filteredUsers = users.filter(user =>
    user.alias.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="kiosk-page">
      <header className="kiosk-header">
        <h1>Robotics Attendance Kiosk</h1>
      </header>

      {error && <div className="error-message">{error}</div>}

      {mode === 'select' && (
        <div className="user-selection">
          <p className="instruction">Select your name to continue</p>
          <input
            type="text"
            className="search-box"
            placeholder="Search by alias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="user-grid">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                className={`user-button ${user.role}`}
                onClick={() => handleUserSelect(user)}
              >
                {user.alias}
                {user.role && (
                  <span className="role-badge">{user.role}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'pin-entry' && (
        <div className="pin-entry">
          <h2>Welcome, {selectedUser.alias}</h2>
          <p>Enter your PIN</p>
          <input
            type="password"
            className="pin-input"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength="6"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') handlePinSubmit();
            }}
          />
          <div className="button-group">
            <button
              className="btn btn-success"
              onClick={handlePinSubmit}
              disabled={!pin || loading}
            >
              {loading ? 'Verifying...' : 'OK'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={resetToHome}
              disabled={loading}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default KioskPage;
