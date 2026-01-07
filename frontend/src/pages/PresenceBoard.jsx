
import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../services/api';
import api from '../services/api';
import './PresenceBoard.css';


function getHourOffset(date) {
  const d = new Date(date);
  return d.getHours() + d.getMinutes() / 60;
}

function PresenceBoard() {
  const [sessions, setSessions] = useState([]);
  const [absences, setAbsences] = useState({});
  const [coreHours, setCoreHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(new Date());
  const [seasonType, setSeasonType] = useState('build');

  useEffect(() => {
    loadSessions();
    loadAbsences();
    loadCoreHours();
    const interval = setInterval(() => {
      setNow(new Date());
      loadSessions();
    }, 30000);
    return () => clearInterval(interval);
  }, [seasonType]);

  const loadSessions = async () => {
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const response = await attendanceApi.getTimeline(dateStr);
      setSessions(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load attendance data');
      setLoading(false);
    }
  };

  const loadAbsences = async () => {
    try {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const response = await api.get('/absences/future');
      
      // Index absences by student ID
      const absenceMap = {};
      response.data.forEach(absence => {
        if (absence.absence_date === dateStr) {
          absenceMap[absence.student_id] = absence;
        }
      });
      setAbsences(absenceMap);
    } catch (err) {
      console.error('Failed to load absences:', err);
    }
  };

  const loadCoreHours = async () => {
    try {
      const response = await api.get('/core-hours', {
        params: { seasonType }
      });
      setCoreHours(response.data);
    } catch (err) {
      console.error('Failed to load core hours:', err);
    }
  };

  // Group sessions by user
  const users = {};
  sessions.forEach(session => {
    if (!users[session.user_id]) {
      users[session.user_id] = {
        alias: session.alias,
        role: session.role,
        sessions: [],
      };
    }
    users[session.user_id].sessions.push(session);
  });

  // Sort users by alias
  const userList = Object.entries(users).sort((a, b) => a[1].alias.localeCompare(b[1].alias));


  // Dynamically determine timeline range
  let minHour = 8;
  let maxHour = 24;
  if (sessions.length > 0) {
    let min = Infinity;
    let max = -Infinity;
    sessions.forEach(session => {
      const checkIn = getHourOffset(session.check_in_time);
      min = Math.min(min, checkIn);
      let checkOut = session.check_out_time ? getHourOffset(session.check_out_time) : getHourOffset(now);
      // Clamp to current time if checkout is in the future
      checkOut = Math.min(checkOut, getHourOffset(now));
      max = Math.max(max, checkOut);
    });
    minHour = Math.floor(Math.max(0, min - 1));
    maxHour = Math.ceil(Math.min(24, max + 1));
  }
  const HOURS = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

  if (loading) {
    return <div className="loading">Loading presence board...</div>;
  }

  const dayOfWeek = now.getDay();
  const todaysCoreHours = coreHours.filter(ch => ch.day_of_week === dayOfWeek);

  return (
    <div className="presence-board">
      <header className="board-header" style={{ position: 'relative' }}>
        <h1>Presence Timeline</h1>
        <a href="/kiosk" className="kiosk-link" style={{ color: '#4fd1c5', fontWeight: 'bold', fontSize: '1.1rem', marginLeft: '1.5rem', textDecoration: 'underline' }}>
          Return to Kiosk
        </a>
        <div className="timeline-guide" style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,255,255,0.95)', color: '#222', borderRadius: 8, padding: '0.7em 1.2em', fontSize: '0.95rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxWidth: '400px' }}>
          <strong>Legend:</strong><br />
          <span style={{ display: 'inline-block', width: 18, height: 10, background: '#4fd1c5', borderRadius: 3, marginRight: 6, verticalAlign: 'middle' }}></span> Past presence<br />
          <span style={{ display: 'inline-block', width: 18, height: 10, background: '#f6e05e', borderRadius: 3, marginRight: 6, verticalAlign: 'middle' }}></span> Still on site<br />
          <span style={{ display: 'inline-block', width: 18, height: 10, background: '#90ee90', borderRadius: 3, marginRight: 6, verticalAlign: 'middle' }}></span> Excused Absence<br />
          <span style={{ display: 'inline-block', width: 3, height: 10, background: '#ff6b6b', borderRadius: 2, marginRight: 6, verticalAlign: 'middle' }}></span> Current time
        </div>
        <p className="update-time">
          Last updated: {now.toLocaleTimeString()}
        </p>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="timeline-grid">
        <div className="timeline-header">
          <div className="timeline-label user-label-header"></div>
          {HOURS.map(hour => (
            <div key={hour} className="timeline-hour">{hour}</div>
          ))}
        </div>
        <div className="timeline-body">
          {/* Current time marker */}
          {(() => {
            const currentHour = getHourOffset(now);
            if (currentHour >= minHour && currentHour <= maxHour) {
              const position = ((currentHour - minHour) / (maxHour - minHour)) * 100;
              return (
                <div 
                  className="current-time-marker" 
                  style={{ left: `calc(160px + (100% - 160px) * ${position} / 100)` }}
                  title={`Current time: ${now.toLocaleTimeString()}`}
                ></div>
              );
            }
            return null;
          })()}
          
          {userList.length === 0 ? (
            <div className="empty-state">
              <p>No attendance records for today</p>
            </div>
          ) : (
            userList.map(([userId, user]) => {
              const absence = absences[userId];
              const isExcusedAbsent = absence && absence.status === 'approved';
              
              return (
                <div className={`timeline-row${isExcusedAbsent ? ' excused-absent' : ''}`} key={userId}>
                  <div className={`timeline-label user-label${isExcusedAbsent ? ' excused-label' : ''}${user.role === 'mentor' || user.role === 'coach' ? ' bold-label' : ''}`}>
                    {user.alias} {user.role === 'mentor' ? '(Mentor)' : user.role === 'coach' ? '(Coach)' : ''}
                    {isExcusedAbsent && <span className="excused-badge">Excused Absence</span>}
                  </div>
                  <div className="timeline-bars">
                    {isExcusedAbsent ? (
                      <div className="excused-bar" title={`Excused absence: ${absence.notes}`}></div>
                    ) : (
                      user.sessions.map((session, idx) => {
                        const start = Math.max(getHourOffset(session.check_in_time), minHour);
                        const rawEnd = session.check_out_time ? getHourOffset(session.check_out_time) : getHourOffset(now);
                        // Clamp end time to current time (prevent future checkout times from displaying)
                        const end = Math.min(rawEnd, getHourOffset(now));
                        const clampedEnd = Math.min(end, maxHour);
                        const left = ((start - minHour) / (maxHour - minHour)) * 100;
                        const width = ((clampedEnd - start) / (maxHour - minHour)) * 100;
                        const isActive = !session.check_out_time;
                        
                        return (
                          <div
                            key={idx}
                            className={`timeline-bar${isActive ? ' active' : ''}`}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            title={`In: ${new Date(session.check_in_time).toLocaleTimeString()}${session.check_out_time ? `\nOut: ${new Date(session.check_out_time).toLocaleTimeString()}` : '\nStill on site'}`}
                          ></div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default PresenceBoard;
