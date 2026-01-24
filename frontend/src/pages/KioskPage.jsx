import React, { useState, useEffect } from 'react';
import { kioskApi } from '../services/api';
import api from '../services/api';
import RoboticsIllustration from '../components/RoboticsIllustration';
import './KioskPage.css';

function KioskPage({ onAuth }) {
  const [mode, setMode] = useState('select'); // 'select', 'pin-entry'
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [userStatuses, setUserStatuses] = useState({});

  useEffect(() => {
    loadUsers();
    loadUserStatuses();
    // Refresh statuses every 30 seconds
    const interval = setInterval(loadUserStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUsers = async () => {
    try {
      const response = await kioskApi.getUsers();
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users');
    }
  };

  const loadUserStatuses = async () => {
    try {
      const response = await api.get('/attendance/timeline', {
        params: { 
          date: new Date().toISOString().split('T')[0],
          tzOffsetMinutes: new Date().getTimezoneOffset()
        }
      });
      const sessions = response.data || [];
      const statuses = {};
      sessions.forEach(session => {
        if (!session.check_out_time) {
          statuses[session.user_id] = {
            status: 'checked-in',
            checkInTime: session.check_in_time
          };
        }
      });
      setUserStatuses(statuses);
    } catch (err) {
      console.error('Failed to load user statuses:', err);
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

  const formatOnsiteDuration = (checkInTime) => {
    const checkIn = new Date(checkInTime);
    const now = new Date();
    const diffMs = now - checkIn;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const searchLower = searchTerm.toLowerCase();
  const students = users.filter(u => u.role === 'student' && u.alias.toLowerCase().includes(searchLower));
  const mentorsCoaches = users.filter(u => (u.role === 'mentor' || u.role === 'coach') && u.alias.toLowerCase().includes(searchLower));

  return (
    <div className="kiosk-page">
      <header className="kiosk-header">
        <div className="header-content">
          <div className="robot-mascot">
            <RoboticsIllustration />
          </div>
          <div className="header-text">
            <h1>
              Robotics
              <br />
              Attendance
              <br />
              Kiosk
            </h1>
            <p className="tagline">Welcome to the program!</p>
          </div>
        </div>
        {mode === 'select' && (
          <div className="search-container">
            <p className="instruction">Select your name to continue</p>
            <input
              type="text"
              className="search-box"
              placeholder="Search by alias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
        <a href="/presenceboard" className="presenceboard-link">
          📊 Presence Board
        </a>
      </header>

      {error && <div className="error-message">{error}</div>}

      {mode === 'select' && (
        <>
          <div className="users-container">
            <div className="user-selection">
              {students.length > 0 && (
                <>
                  <h3 className="user-group-heading">Students</h3>
                  <div className="user-grid">
                    {students.map((user) => {
                      const userStatus = userStatuses[user.id];
                      const isCheckedIn = userStatus?.status === 'checked-in';
                      return (
                        <button
                          key={user.id}
                          className={`user-button student ${isCheckedIn ? 'checked-in' : 'not-checked-in'}`}
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className="user-button-name">{user.alias}</div>
                          {isCheckedIn && userStatus.checkInTime && (
                            <div className="user-button-duration">{formatOnsiteDuration(userStatus.checkInTime)}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              {mentorsCoaches.length > 0 && (
                <>
                  <h3 className="user-group-heading">Mentors & Coaches</h3>
                  <div className="user-grid">
                    {mentorsCoaches.map((user) => {
                      const userStatus = userStatuses[user.id];
                      const isCheckedIn = userStatus?.status === 'checked-in';
                      return (
                        <button
                          key={user.id}
                          className={`user-button mentor-coach ${isCheckedIn ? 'checked-in' : 'not-checked-in'}`}
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className="user-button-name">{user.alias}</div>
                          {isCheckedIn && userStatus.checkInTime && (
                            <div className="user-button-duration">{formatOnsiteDuration(userStatus.checkInTime)}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
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
            onKeyDown={(e) => {
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
