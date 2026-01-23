
import React, { useState, useEffect, useRef } from 'react';
import AdminNav from '../components/AdminNav';
import api, { attendanceApi, kioskApi, settingsApi } from '../services/api';
import Leaderboard from './Leaderboard';
import './PresenceBoard.css';


function getHourOffset(date) {
  const d = new Date(date);
  return d.getHours() + d.getMinutes() / 60;
}

function PresenceBoard() {
  const [sessions, setSessions] = useState([]);
  const [absences, setAbsences] = useState({});
  const [coreHoursStatus, setCoreHoursStatus] = useState({}); // { studentId: 'compliant'|'excused_absent'|'unexcused_absent' }
  const [coreHours, setCoreHours] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(new Date());
  const [seasonType, setSeasonType] = useState('build');
  const [timelineWindow, setTimelineWindow] = useState({ min: 8, max: 24 });
  const barOffsetPx = 184; // Fixed offset: status-col (16px) + gaps (0.25rem x2) + user-label (160px)
  const timelineBodyRef = useRef(null);
  const [colors, setColors] = useState({
    studentCheckedIn: '#48bb78',
    mentorCheckedIn: '#4299e1',
    notCheckedIn: '#a0aec0',
    pastSession: '#4fd1c5',
    activeSession: '#f6e05e',
    currentTime: '#ff6b6b'
  });

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

  // Load core hours status after students are loaded
  useEffect(() => {
    if (students.length > 0) {
      loadCoreHoursStatus();
    }
  }, [students]);

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
      // Load colors
      if (res.data) {
        setColors({
          studentCheckedIn: res.data.color_student_checked_in || '#48bb78',
          mentorCheckedIn: res.data.color_mentor_checked_in || '#4299e1',
          notCheckedIn: res.data.color_not_checked_in || '#a0aec0',
          pastSession: res.data.color_past_session || '#4fd1c5',
          activeSession: res.data.color_active_session || '#f6e05e',
          currentTime: res.data.color_current_time || '#ff6b6b'
        });
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

  const loadCoreHoursStatus = async () => {
    try {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      
      console.log('[PresenceBoard] Loading core hours status for', students.length, 'students on', dateStr);
      
      // Fetch status for all students
      const statusMap = {};
      for (const student of students) {
        try {
          const response = await api.get(`/absences/public/status/${student.id}/${dateStr}`);
          statusMap[student.id] = response.data.status;
          console.log(`[PresenceBoard] ${student.alias}: ${response.data.status}`);
        } catch (err) {
          // Default to compliant if error
          statusMap[student.id] = 'compliant';
          console.warn(`[PresenceBoard] Error loading status for ${student.alias}:`, err.message);
        }
      }
      setCoreHoursStatus(statusMap);
      console.log('[PresenceBoard] Core hours status loaded:', statusMap);
    } catch (err) {
      console.error('Failed to load core hours status:', err);
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
  const groupBIds = new Set(groupB.map(([id]) => String(id)));
  // Group C: Students with excused absences (today) and no sessions
  const groupC = students
    .filter(s => isExcused(s.id) && !groupBIds.has(String(s.id)))
    .map(s => [s.id, combinedUsers[s.id]])
    .sort((a, b) => a[1].alias.localeCompare(b[1].alias));
  // Group D: Students with unexcused absences OR no absences, and no sessions
  const groupD = students
    .filter(s => !groupBIds.has(String(s.id)) && !isExcused(s.id))
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
    <div className="presence-board" style={{
      '--color-student-checked-in': colors.studentCheckedIn,
      '--color-mentor-checked-in': colors.mentorCheckedIn,
      '--color-not-checked-in': colors.notCheckedIn,
      '--color-past-session': colors.pastSession,
      '--color-active-session': colors.activeSession,
      '--color-current-time': colors.currentTime
    }}>
      <header className="board-header">
        <h1>Presence Timeline <span className="update-time">(Last updated: {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })})</span></h1>
        <a href="/kiosk" className="kiosk-link">
          Return to Kiosk
        </a>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="presence-board-layout">
        <div className="timeline-section">
      <div className="timeline-container">
        <div className="timeline-grid">
        <div className="timeline-header" style={{ position: 'relative' }}>
          <div className="status-col status-col-header" aria-hidden="true" />
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
                      border: '3px solid #ff6b6b',
                      borderRadius: '4px',
                      pointerEvents: 'none',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 107, 107, 0.15)'
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
        <div className="timeline-body" ref={timelineBodyRef}>
          {/* Current time marker wrapper - aligns with timeline-bars */}
          <div className="current-time-marker-wrapper">
            <div className="timeline-hour-lines" aria-hidden="true">
              <div className="timeline-hour-boundary" style={{ left: '0%' }}></div>
              <div className="timeline-hour-boundary" style={{ left: '100%' }}></div>
              {HOURS.map((hour) => {
                const hourIndex = hour - minHour;
                const totalHours = HOURS.length;
                const position = ((hourIndex + 0.5) / totalHours) * 100;
                return (
                  <div
                    key={`hour-line-${hour}`}
                    className="timeline-hour-line"
                    style={{ left: `${position}%` }}
                  ></div>
                );
              })}
            </div>
            {/* DEBUG: Yellow bounding box */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                border: '3px solid yellow',
                pointerEvents: 'none',
                zIndex: 998,
                boxSizing: 'border-box'
              }}
            ></div>
            
            {(() => {
              const currentHour = getHourOffset(now);
              if (currentHour >= minHour && currentHour <= maxHour) {
                // Calculate percentage same as timeline bars
                const position = ((currentHour - minHour) / span) * 100;
                
                // Get bounding box info for debugging
                const wrapper = document.querySelector('.current-time-marker-wrapper');
                if (wrapper) {
                  const rect = wrapper.getBoundingClientRect();
                  const markerLeft = (position / 100) * rect.width;
                  console.log(
                    `[PresenceBoard] ` +
                    `Time: ${now.toLocaleTimeString()} (${currentHour.toFixed(2)}h) | ` +
                    `Yellow Box: left=${rect.left.toFixed(0)}px, width=${rect.width.toFixed(0)}px | ` +
                    `Red Line: ${position.toFixed(2)}% = ${markerLeft.toFixed(0)}px from box start = ${(rect.left + markerLeft).toFixed(0)}px absolute`
                  );
                }
                
                return (
                  <div 
                    className="current-time-marker" 
                    style={{ left: `${position}%` }}
                    title={`Current time: ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`}
                  ></div>
                );
              }
              return null;
            })()}
          </div>
          
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
                    left: `calc(${barOffsetPx}px + (100% - ${barOffsetPx}px) * ${Math.max(0, left)} / 100)`,
                    width: `calc((100% - ${barOffsetPx}px) * ${Math.min(100, width)} / 100)`,
                    top: 0,
                    bottom: 0,
                    background: 'rgba(50, 75, 128, 0.5)',
                    borderLeft: '3px solid rgba(50, 75, 128, 0.7)',
                    borderRight: '3px solid rgba(50, 75, 128, 0.7)',
                    pointerEvents: 'none',
                    zIndex: 0
                  }}
                  title={`Required: ${ch.start_time} - ${ch.end_time}`}
                ></div>
              );
            }
            return null;
          })}
          
          {/* Group A: Coaches / Mentors (present only) */}
          {groupA.map(([userId, user]) => {
            const absence = absences[userId];
            const isExcusedAbsent = absence && absence.status === 'approved';
            const hasSession = user.sessions.length > 0;
            return (
              <div className={`timeline-row`} key={`A-${userId}`}>
                <div className="status-col" aria-label="status" />
                <div className={`timeline-label user-label ${hasSession ? 'mentor-coach-checked-in' : 'not-checked-in'}`}>
                  {user.alias} {user.role === 'mentor' ? '(Mentor)' : user.role === 'coach' ? '(Coach)' : ''}
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
          {groupB.map(([userId, user]) => {
            const absence = absences[userId];
            const isExcusedAbsent = absence && absence.status === 'approved';
            const hasSession = user.sessions.length > 0;
            const status = coreHoursStatus[userId];
            return (
              <div className={`timeline-row`} key={`B-${userId}`}>
                <div className="status-col" aria-label="status">
                  {status === 'compliant' && (
                    <span className="status-icon checkmark">✓</span>
                  )}
                  {status === 'excused_absent' && (
                    <span className="status-icon approved">E</span>
                  )}
                  {status === 'unexcused_absent' && (
                    <span className="status-icon unexcused">U</span>
                  )}
                </div>
                <div className={`timeline-label user-label ${hasSession ? 'student-checked-in' : 'not-checked-in'}`}>
                  {user.alias}
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
          {groupC.map(([userId, user]) => {
            const absence = absences[userId];
            const isExcusedAbsent = true;
            const status = coreHoursStatus[userId];
            return (
              <div className={`timeline-row`} key={`C-${userId}`}>
                <div className="status-col" aria-label="status">
                  {status === 'excused_absent' && (
                    <span className="status-icon approved">E</span>
                  )}
                </div>
                <div className={`timeline-label user-label not-checked-in`}>
                  {user.alias}
                </div>
                <div className="timeline-bars">
                  <div className="excused-bar" title={`Excused absence: ${absence?.notes || ''}`}></div>
                </div>
              </div>
            );
          })}

          {/* Group D: Students with unexcused absences or no absences, and no sessions */}
          {groupD.map(([userId, user]) => {
            const absence = absences[userId];
            const isUnexcused = !!absence && absence.status !== 'approved';
            const status = coreHoursStatus[userId];
            return (
              <div className={`timeline-row`} key={`D-${userId}`}>
                <div className="status-col" aria-label="status">
                  {status === 'compliant' && (
                    <span className="status-icon checkmark">✓</span>
                  )}
                  {status === 'excused_absent' && (
                    <span className="status-icon approved">E</span>
                  )}
                  {status === 'unexcused_absent' && (
                    <span className="status-icon unexcused">U</span>
                  )}
                </div>
                <div className={`timeline-label user-label not-checked-in`}>
                  {user.alias}
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
        </div>
        <div className="leaderboard-section">
          <Leaderboard />
          <div className="timeline-legend">
            <strong>Legend</strong>
             <div className="legend-item">
               <span className="legend-color" style={{ background: colors.pastSession }}></span>
               <span>Completed Sessions</span>
             </div>
             <div className="legend-item">
               <span className="legend-color" style={{ background: colors.activeSession }}></span>
               <span>Active Sessions</span>
             </div>
             <div className="legend-item">
              <span className="legend-color" style={{ background: 'rgba(50, 75, 128, 0.5)', border: '1px solid rgba(50, 75, 128, 0.7)' }}></span>
               <span>Core Hours (required time)</span>
             </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: colors.currentTime, width: '3px' }}></span>
              <span>Current time</span>
            </div>
            <div className="legend-item">
              <span className="status-icon checkmark" style={{ background: '#176a1a', color: '#fff' }}>✓</span>
              <span>Present During Core Hours</span>
            </div>
            <div className="legend-item">
              <span className="status-icon unexcused" style={{ background: '#e53935', color: '#fff' }}>U</span>
              <span>Unexcused absence</span>
            </div>
            <div className="legend-item">
              <span className="status-icon approved" style={{ background: '#176a1a', color: '#fff' }}>E</span>
              <span>Excused absence</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PresenceBoard;
