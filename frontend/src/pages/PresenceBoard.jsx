
import React, { useState, useEffect } from 'react';
import api, { attendanceApi, kioskApi, settingsApi } from '../services/api';
import './PresenceBoard.css';


function getHourOffset(date) {
  const d = new Date(date);
  return d.getHours() + d.getMinutes() / 60;
}

function PresenceBoard() {
  const [sessions, setSessions] = useState([]);
  const [absences, setAbsences] = useState({});
  const [coreHours, setCoreHours] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(new Date());
  const [seasonType, setSeasonType] = useState('build');
  const [timelineWindow, setTimelineWindow] = useState({ min: 8, max: 24 });

  useEffect(() => {
    loadSessions();
    loadAbsences();
    loadCoreHours();
    loadStudents();
    loadSettings();
    const interval = setInterval(() => {
      setNow(new Date());
      loadSessions();
    }, 30000);
    return () => clearInterval(interval);
  }, [seasonType]);

  const loadSettings = async () => {
    try {
      const res = await settingsApi.getPublic();
      const start = Number(res.data?.presence_start_hour ?? 8);
      const end = Number(res.data?.presence_end_hour ?? 24);
      if (Number.isFinite(start) && Number.isFinite(end) && start >= 0 && end <= 24 && start < end) {
        setTimelineWindow({ min: start, max: end });
      } else {
        console.warn('[PresenceBoard] Invalid settings payload, using defaults');
        setTimelineWindow({ min: 8, max: 24 });
      }
    } catch (err) {
      console.warn('Failed to load settings, using defaults:', err);
      setTimelineWindow({ min: 8, max: 24 });
    }
  };

  const loadSessions = async () => {
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const response = await attendanceApi.getTimelineWithTz(dateStr);
      const data = response.data || [];
      // Debug: log sessions count for visibility
      if (typeof window !== 'undefined' && window.console) {
        console.log('[PresenceBoard] Timeline sessions loaded:', data.length);
      }
      setSessions(data);
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
      const response = await api.get('/absences/public/by-date', {
        params: { date: dateStr, seasonType }
      });
      // Index absences by student ID (status only)
      const absenceMap = {};
      (response.data || []).forEach(abs => {
        absenceMap[abs.student_id] = { status: abs.status };
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

  const loadStudents = async () => {
    try {
      const res = await kioskApi.getUsers();
      const all = res.data || [];
      const onlyStudents = all.filter(u => u.role === 'student');
      setStudents(onlyStudents);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  // Build combined user map: include all students (even with no sessions) and mentors/coaches with sessions (present only)
  const combinedUsers = {};
  // Start with sessions for present users (students, mentors, coaches)
  sessions.forEach(session => {
    if (!combinedUsers[session.user_id]) {
      combinedUsers[session.user_id] = {
        alias: session.alias,
        role: session.role,
        sessions: [],
      };
    }
    combinedUsers[session.user_id].sessions.push(session);
  });
  // Add all students even if they have no sessions
  students.forEach(s => {
    if (!combinedUsers[s.id]) {
      combinedUsers[s.id] = {
        alias: s.alias || s.name || `Student ${s.id}`,
        role: 'student',
        sessions: [],
      };
    } else {
      // Ensure alias up to date if missing
      if (!combinedUsers[s.id].alias && (s.alias || s.name)) {
        combinedUsers[s.id].alias = s.alias || s.name;
      }
    }
  });

  // Derive group membership
  const isExcused = (uid) => !!absences[uid] && absences[uid].status === 'approved';
  const hasUnexcused = (uid) => !!absences[uid] && absences[uid].status !== 'approved';

  const entries = Object.entries(combinedUsers);
  // Group A: Coaches/Mentors present (must have sessions)
  const groupA = entries
    .filter(([_, u]) => (u.role === 'mentor' || u.role === 'coach') && u.sessions.length > 0)
    .sort((a, b) => a[1].alias.localeCompare(b[1].alias));
  // Group B: Students with sessions today (include excused as well)
  const groupB = entries
    .filter(([id, u]) => u.role === 'student' && u.sessions.length > 0)
    .sort((a, b) => a[1].alias.localeCompare(b[1].alias));
  const groupBIds = new Set(groupB.map(([id]) => Number(id)));
  // Group C: Students with excused absences (today) and no sessions
  const groupC = students
    .filter(s => isExcused(s.id) && !groupBIds.has(s.id))
    .map(s => [s.id, combinedUsers[s.id]])
    .sort((a, b) => a[1].alias.localeCompare(b[1].alias));
  // Group D: Students with unexcused absences OR no absences, and no sessions
  const groupD = students
    .filter(s => !groupBIds.has(s.id) && !isExcused(s.id))
    .map(s => [s.id, combinedUsers[s.id]])
    .sort((a, b) => a[1].alias.localeCompare(b[1].alias));


  // Timeline range comes from system settings
  const minHour = timelineWindow.min;
  const maxHour = timelineWindow.max;
  const span = Math.max(1, maxHour - minHour);
  const HOURS = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

  // Helper: consistent bar positioning logic for active and past sessions
  const computeBarPosition = (checkIn, checkOut) => {
    const startHour = Math.max(getHourOffset(checkIn), minHour);
    const rawEndHour = checkOut ? getHourOffset(checkOut) : getHourOffset(now);
    const endHour = Math.min(rawEndHour, getHourOffset(now));
    const clampedEnd = Math.min(endHour, maxHour);
    let left = ((startHour - minHour) / span) * 100;
    let width = ((clampedEnd - startHour) / span) * 100;
    left = Math.max(0, Math.min(100, left));
    width = Math.max(0, Math.min(100 - left, width));
    const isActive = !checkOut;
    return { left, width, isActive };
  };

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
          <span style={{ display: 'inline-block', width: 18, height: 10, background: 'rgba(100, 150, 255, 0.15)', border: '1px solid rgba(100, 150, 255, 0.3)', borderRadius: 3, marginRight: 6, verticalAlign: 'middle' }}></span> Required Practice Time<br />
          <span style={{ display: 'inline-block', width: 3, height: 10, background: '#ff6b6b', borderRadius: 2, marginRight: 6, verticalAlign: 'middle' }}></span> Current time
        </div>
        <p className="update-time">
          Last updated: {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
        </p>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="timeline-grid">
        <div className="timeline-header" style={{ position: 'relative' }}>
          <div className="timeline-label user-label-header"></div>
          <div style={{ position: 'relative', flex: '1 1 0', display: 'flex' }}>
            {/* Red boxes for required practice times */}
            {todaysCoreHours.map((ch, idx) => {
              const [startHour, startMin] = ch.start_time.split(':').map(Number);
              const [endHour, endMin] = ch.end_time.split(':').map(Number);
              const start = startHour + startMin / 60;
              const end = endHour + endMin / 60;
              
              const left = ((start - minHour) / span) * 100;
              const width = ((end - start) / span) * 100;
              
              if (end >= minHour && start <= maxHour) {
                return (
                  <div
                    key={`header-${idx}`}
                    style={{
                      position: 'absolute',
                      left: `${Math.max(0, left)}%`,
                      width: `${Math.min(100, width)}%`,
                      height: '100%',
                      border: '2px solid #ff6b6b',
                      borderRadius: '4px',
                      pointerEvents: 'none',
                      boxSizing: 'border-box'
                    }}
                    title={`Required: ${ch.start_time} - ${ch.end_time}`}
                  ></div>
                );
              }
              return null;
            })}
            {HOURS.map(hour => (
              <div key={hour} className="timeline-hour" style={{ flex: '1 1 0' }}>{hour}</div>
            ))}
          </div>
        </div>
        <div className="timeline-body">
          {/* Core hours shaded regions - drawn first so they're behind everything */}
          {todaysCoreHours.map((ch, idx) => {
            // Parse start and end times
            const [startHour, startMin] = ch.start_time.split(':').map(Number);
            const [endHour, endMin] = ch.end_time.split(':').map(Number);
            const start = startHour + startMin / 60;
            const end = endHour + endMin / 60;
            
            // Calculate position and width
            const left = ((start - minHour) / span) * 100;
            const width = ((end - start) / span) * 100;
            
            // Only render if within visible range
            if (end >= minHour && start <= maxHour) {
              return (
                <div
                  key={idx}
                  className="core-hours-shading"
                  style={{
                    position: 'absolute',
                    left: `calc(160px + (100% - 160px) * ${Math.max(0, left)} / 100)`,
                    width: `calc((100% - 160px) * ${Math.min(100, width)} / 100)`,
                    top: 0,
                    bottom: 0,
                    background: 'rgba(100, 150, 255, 0.2)',
                    borderLeft: '2px solid rgba(100, 150, 255, 0.5)',
                    borderRight: '2px solid rgba(100, 150, 255, 0.5)',
                    pointerEvents: 'none',
                    zIndex: 0
                  }}
                  title={`Required: ${ch.start_time} - ${ch.end_time}`}
                ></div>
              );
            }
            return null;
          })}
          
          {/* Current time marker */}
          {(() => {
            const currentHour = getHourOffset(now);
            if (currentHour >= minHour && currentHour <= maxHour) {
              // Clamp position to stay within 0-100% range
              let position = ((currentHour - minHour) / span) * 100;
              position = Math.max(0, Math.min(100, position)); // Keep between 0-100%
              return (
                <div 
                  className="current-time-marker" 
                  style={{ left: `calc(160px + (100% - 160px) * ${position} / 100)` }}
                  title={`Current time: ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`}
                ></div>
              );
            }
            return null;
          })()}
          
          {/* Group A: Coaches / Mentors (present only) */}
          {groupA.length > 0 && (
            <div className="timeline-row" style={{ marginTop: '0.5rem' }}>
              <div className="timeline-label user-label" style={{ fontWeight: 700 }}>Coaches / Mentors</div>
              <div className="timeline-bars" />
            </div>
          )}
          {groupA.map(([userId, user]) => {
            const absence = absences[userId];
            const isExcusedAbsent = absence && absence.status === 'approved';
            return (
              <div className={`timeline-row${isExcusedAbsent ? ' excused-absent' : ''}`} key={`A-${userId}`}>
                <div className={`timeline-label user-label bold-label${isExcusedAbsent ? ' excused-label' : ''}`}>
                  {user.alias} {user.role === 'mentor' ? '(Mentor)' : user.role === 'coach' ? '(Coach)' : ''}
                  {isExcusedAbsent && <span className="excused-badge">Excused Absence</span>}
                </div>
                <div className="timeline-bars">
                  {user.sessions.map((session, idx) => {
                    const { left, width, isActive } = computeBarPosition(session.check_in_time, session.check_out_time);
                    return (
                      <div
                        key={idx}
                        className={`timeline-bar${isActive ? ' active' : ''}`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={`In: ${new Date(session.check_in_time).toLocaleTimeString()}${session.check_out_time ? `\nOut: ${new Date(session.check_out_time).toLocaleTimeString()}` : '\nStill on site'}`}
                      ></div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Group B: Students with sessions today */}
          {groupB.length > 0 && (
            <div className="timeline-row" style={{ marginTop: '1rem' }}>
              <div className="timeline-label user-label" style={{ fontWeight: 700 }}>Students (Sessions Today)</div>
              <div className="timeline-bars" />
            </div>
          )}
          {groupB.map(([userId, user]) => {
            const absence = absences[userId];
            const isExcusedAbsent = absence && absence.status === 'approved';
            return (
              <div className={`timeline-row${isExcusedAbsent ? ' excused-absent' : ''}`} key={`B-${userId}`}>
                <div className={`timeline-label user-label${isExcusedAbsent ? ' excused-label' : ''}`}>
                  {user.alias}
                  {isExcusedAbsent && <span className="excused-badge">Excused Absence</span>}
                </div>
                <div className="timeline-bars">
                  {user.sessions.map((session, idx) => {
                    const { left, width, isActive } = computeBarPosition(session.check_in_time, session.check_out_time);
                    return (
                      <div
                        key={idx}
                        className={`timeline-bar${isActive ? ' active' : ''}`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={`In: ${new Date(session.check_in_time).toLocaleTimeString()}${session.check_out_time ? `\nOut: ${new Date(session.check_out_time).toLocaleTimeString()}` : '\nStill on site'}`}
                      ></div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Group C: Students with excused absences */}
          {groupC.length > 0 && (
            <div className="timeline-row" style={{ marginTop: '1rem' }}>
              <div className="timeline-label user-label" style={{ fontWeight: 700 }}>Students (Excused Absences)</div>
              <div className="timeline-bars" />
            </div>
          )}
          {groupC.map(([userId, user]) => {
            const absence = absences[userId];
            const isExcusedAbsent = true;
            return (
              <div className={`timeline-row excused-absent`} key={`C-${userId}`}>
                <div className={`timeline-label user-label excused-label`}>
                  {user.alias}
                  <span className="excused-badge">Excused Absence</span>
                </div>
                <div className="timeline-bars">
                  <div className="excused-bar" title={`Excused absence: ${absence?.notes || ''}`}></div>
                </div>
              </div>
            );
          })}

          {/* Group D: Students with unexcused absences or no absences, and no sessions */}
          {groupD.length > 0 && (
            <div className="timeline-row" style={{ marginTop: '1rem' }}>
              <div className="timeline-label user-label" style={{ fontWeight: 700 }}>Students (Unexcused / No Absence)</div>
              <div className="timeline-bars" />
            </div>
          )}
          {groupD.map(([userId, user]) => {
            const absence = absences[userId];
            const isUnexcused = !!absence && absence.status !== 'approved';
            return (
              <div className={`timeline-row`} key={`D-${userId}`}>
                <div className={`timeline-label user-label`}>
                  {user.alias}
                  {isUnexcused && <span className="excused-badge" style={{ background: '#f6ad55', color: '#222' }}>Unexcused Absence</span>}
                </div>
                <div className="timeline-bars">
                  {/* Empty bars area to indicate no sessions */}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PresenceBoard;
