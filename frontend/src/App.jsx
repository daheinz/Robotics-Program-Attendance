import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import KioskPage from './pages/KioskPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PresenceBoard from './pages/PresenceBoard';
import Leaderboard from './pages/Leaderboard';
import ReportingPage from './pages/ReportingPage';
import CoreHoursConfig from './pages/CoreHoursConfig';
import SlideshowPage from './pages/SlideshowPage';
import api, { kioskApi, attendanceApi } from './services/api';
import './App.css';

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

function AppContent() {
  const [authenticated, setAuthenticated] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
  const [userName, setUserName] = useState(localStorage.getItem('userName'));
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const navigate = useNavigate();
  const location = useLocation();

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

  const standalonePaths = ['/leaderboard', '/presenceboard', '/slideshow'];
  if (standalonePaths.includes(location.pathname)) {
    return (
      <div className="app">
        <Routes>
          <Route path="/presenceboard" element={<PresenceBoard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/slideshow" element={<SlideshowPage />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="app">
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
                {userRole && userRole !== 'student' && (
                  <Link className="btn btn-secondary" to="/admin">
                    Admin
                  </Link>
                )}
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
                  <StudentDashboard userName={userName} userId={userId} userRole={userRole} onLogout={handleLogout} />
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
      setSuccess(getRandomGoodbye());
      setLoading(false);
      setTimeout(() => {
        if (onLogout) onLogout();
      }, 5000);
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
