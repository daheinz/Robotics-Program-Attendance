import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../services/api';
import './Leaderboard.css';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await attendanceApi.getLeaderboard();
      setLeaderboard(response.data || []);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours) => {
    if (!hours) return '0.00';
    const numHours = typeof hours === 'string' ? parseFloat(hours) : hours;
    return isNaN(numHours) ? '0.00' : numHours.toFixed(2);
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
          <div className="leaderboard-grid">
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
                        <span className="student-name">{student.alias}</span>
                      </div>
                      <div className="col-sessions">
                        {student.session_count}
                      </div>
                      <div className="col-hours">
                        <span className="hours-value">{formatHours(student.total_hours)}</span>
                        <span className="hours-label">hrs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
