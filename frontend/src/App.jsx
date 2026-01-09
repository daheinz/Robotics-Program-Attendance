import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import KioskPage from './pages/KioskPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PresenceBoard from './pages/PresenceBoard';
import ReportingPage from './pages/ReportingPage';
import CoreHoursConfig from './pages/CoreHoursConfig';
import api, { kioskApi, attendanceApi } from './services/api';
import './App.css';

function AppContent() {
  const [authenticated, setAuthenticated] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
  const [userName, setUserName] = useState(localStorage.getItem('userName'));
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const navigate = useNavigate();

  // Inactivity timeout - log out after 5 minutes of inactivity
  useEffect(() => {
    if (!authenticated) return;

    const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
    let timeoutId;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Start the timer
    resetTimer();

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [authenticated]);

  const handleLogout = () => {
    setAuthenticated(false);
    setUserRole(null);
    setUserName(null);
    setUserId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    api.defaults.headers.common['Authorization'] = '';
  };

  const handleKioskAuth = (token, user) => {
    // Store auth data
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userName', user.alias);
    localStorage.setItem('userId', user.id);

    // Update app state
    setAuthenticated(true);
    setUserRole(user.role);
    setUserName(user.alias);
    setUserId(user.id);

    // Setup API interceptor
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Navigate to home page
    navigate('/');
  };

  // Setup API interceptor on mount
  useEffect(() => {
    if (authenticated) {
      const token = localStorage.getItem('token');
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  return (
    <div className="app">
      <Routes>
        {/* Public route - no authentication required */}
        <Route path="/presenceboard" element={<PresenceBoard />} />
      </Routes>
      
      {!authenticated ? (
          // Kiosk Mode - Entry Point
          <KioskPage onAuth={handleKioskAuth} />
        ) : (
          <>
            <header className="app-header">
              <div className="header-left">
                <h1 className="app-title">Robotics Attendance</h1>
              </div>
              <div className="header-right">
                <span className="user-info">
                  {userName} ({userRole})
                </span>
                <button className="btn-logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </header>

            <Routes>
              <Route
                path="/"
                element={
                  userRole === 'student' ? (
                    <StudentDashboard userName={userName} userId={userId} onLogout={handleLogout} />
                  ) : (
                    <MentorCoachDashboard userName={userName} userId={userId} userRole={userRole} onLogout={handleLogout} />
                  )
                }
              />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/presence" element={<PresenceBoard />} />
              <Route path="/reports" element={<ReportingPage />} />
              <Route path="/core-hours" element={<CoreHoursConfig />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </>
        )}
      </div>
  );
}

function MentorCoachDashboard({ userName, userId, userRole, onLogout }) {
  const [checkedIn, setCheckedIn] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [reflectionPrompt, setReflectionPrompt] = useState('');
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkInStatus();
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
      setTimeout(() => {
        if (onLogout) onLogout();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Check-in failed');
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await kioskApi.checkOut(reflection);
      setSuccess('Successfully checked out!');
      setTimeout(() => {
        if (onLogout) onLogout();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Check-out failed');
      setLoading(false);
    }
  };

  return (
    <div className="mentor-dashboard">
      <div className="mentor-container">
        <h1>Welcome, {userName}!</h1>
        <p className="role-badge">Role: {userRole}</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Check-in/out Section */}
        <div className="checkin-section">
          <h2>Attendance</h2>
          <div className="status-card">
            <div className="status-indicator">
              <span className={`status-dot ${checkedIn ? 'checked-in' : 'checked-out'}`}></span>
              <p className="status-text">
                {checkedIn ? 'You are checked in' : 'You are currently not checked in'}
              </p>
            </div>
            {currentSession && checkedIn && (
              <p className="session-info">
                Since {new Date(currentSession.check_in_time).toLocaleTimeString()}
              </p>
            )}
          </div>

          {!checkedIn ? (
            <button className="btn btn-large btn-success" onClick={handleCheckIn} disabled={loading}>
              {loading ? 'Checking in...' : 'Check In'}
            </button>
          ) : (
            <div className="checkout-section">
              <div className="form-group">
                <label>{reflectionPrompt || 'What did you accomplish today?'} (Optional)</label>
                <textarea
                  className="reflection-textarea"
                  rows="4"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Enter your reflection..."
                />
              </div>
              <button
                className="btn btn-large btn-primary"
                onClick={handleCheckOut}
                disabled={loading}
              >
                {loading ? 'Checking out...' : 'Check Out'}
              </button>
            </div>
          )}
        </div>

        {/* Admin Navigation */}
        <nav className="landing-nav">
          <div className="nav-section">
            <h2>Administration</h2>
            <Link to="/admin" className="nav-card nav-card-large">
              <span className="icon">⚙️</span>
              <span>Admin Dashboard</span>
            </Link>
            <Link to="/core-hours" className="nav-card nav-card-large">
              <span className="icon">⏰</span>
              <span>Core Hours Configuration</span>
            </Link>
            <Link to="/reports" className="nav-card nav-card-large">
              <span className="icon">📊</span>
              <span>Reports & Analytics</span>
            </Link>
            <Link to="/presence" className="nav-card nav-card-large">
              <span className="icon">👥</span>
              <span>Presence Board</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
