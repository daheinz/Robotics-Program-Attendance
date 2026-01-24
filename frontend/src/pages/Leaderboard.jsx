import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../services/api';
import './Leaderboard.css';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(() => {
      loadLeaderboard({ silent: true });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadLeaderboard = async ({ silent } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const [leaderboardResult, timelineResult] = await Promise.allSettled([
        attendanceApi.getLeaderboard(),
        attendanceApi.getTimelineWithTz(dateStr),
      ]);

      if (leaderboardResult.status !== 'fulfilled') {
        throw leaderboardResult.reason;
      }

      const baseLeaderboard = leaderboardResult.value.data || [];
      const timelineData = timelineResult.status === 'fulfilled'
        ? timelineResult.value.data || []
        : [];

      const now = new Date();
      const liveHoursByUser = {};

      timelineData.forEach((session) => {
        if (!session.check_out_time && session.check_in_time) {
          const start = new Date(session.check_in_time);
          const elapsedMs = Math.max(0, now - start);
          const elapsedHours = elapsedMs / (1000 * 60 * 60);
          const userId = String(session.user_id);
          liveHoursByUser[userId] = (liveHoursByUser[userId] || 0) + elapsedHours;
        }
      });

      const augmented = baseLeaderboard.map((student) => {
        const baseHours = typeof student.total_hours === 'string'
          ? parseFloat(student.total_hours)
          : Number(student.total_hours || 0);
        const liveHours = liveHoursByUser[String(student.id)] || 0;
        const totalHoursLive = (isNaN(baseHours) ? 0 : baseHours) + liveHours;
        return {
          ...student,
          total_hours_live: totalHoursLive,
        };
      });

      augmented.sort((a, b) => {
        const diff = (b.total_hours_live || 0) - (a.total_hours_live || 0);
        if (diff !== 0) return diff;
        return String(a.alias || '').localeCompare(String(b.alias || ''));
      });
      const withRankChanges = augmented.map((student, index) => {
        const currentRank = index + 1;
        const baselineRank = student.baseline_rank;
        const rankDelta = baselineRank && !student.snapshot_created ? baselineRank - currentRank : 0;
        return {
          ...student,
          rank_delta: rankDelta,
        };
      });

      setLeaderboard(withRankChanges);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const formatHours = (hours) => {
    if (!hours) return '0:00';
    const numHours = typeof hours === 'string' ? parseFloat(hours) : hours;
    if (isNaN(numHours)) return '0:00';
    const wholeHours = Math.floor(numHours);
    let minutes = Math.round((numHours - wholeHours) * 60);
    if (minutes === 60) {
      minutes = 0;
      return `${wholeHours + 1}:${String(minutes).padStart(2, '0')}`;
    }
    return `${wholeHours}:${String(minutes).padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-content">
        <div className="leaderboard-grid">
          <div className="leaderboard-header">
            <h1>🏆 Attendance Leaderboard</h1>
            <p className="leaderboard-subtitle">Top 10 Students by All-Time Attendance Hours</p>
          </div>

          {loading && (
            <div className="loading-state">
              <p>Loading leaderboard...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={loadLeaderboard} className="retry-btn">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {leaderboard.length === 0 ? (
                <div className="empty-state">
                  <p>No attendance data available yet</p>
                </div>
              ) : (
                <div className="leaderboard-table">
                  <div className="table-header">
                    <div className="col-rank">Rank</div>
                    <div className="col-name">Student</div>
                    <div className="col-sessions">Sessions</div>
                    <div className="col-hours">Total Hours</div>
                  </div>
                  <div className="table-body">
                    {leaderboard.map((student, index) => (
                      <div key={student.id} className="table-row">
                        <div className="col-rank">
                          <span className={`rank-badge rank-${index + 1}`}>
                            {index + 1}
                          </span>
                        </div>
                        <div className="col-name">
                          <span className="student-name">
                            {student.rank_delta > 0 && !student.snapshot_created && (
                              <span className="rank-change up" aria-label="Rank up">▲</span>
                            )}
                            {student.rank_delta < 0 && !student.snapshot_created && (
                              <span className="rank-change down" aria-label="Rank down">▼</span>
                            )}
                            {student.rank_delta === 0 && student.baseline_rank && !student.snapshot_created && (
                              <span className="rank-change same" aria-label="Rank unchanged">■</span>
                            )}
                            {student.alias}
                          </span>
                        </div>
                        <div className="col-sessions">
                          {student.session_count}
                        </div>
                        <div className="col-hours">
                          <span className="hours-value">{formatHours(student.total_hours_live ?? student.total_hours)}</span>
                          <span className="hours-label">h:m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
