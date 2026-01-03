import React, { useState, useEffect } from 'react';
import { presenceApi } from '../services/api';
import './PresenceBoard.css';

function PresenceBoard() {
  const [presence, setPresence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPresence();
    const interval = setInterval(loadPresence, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPresence = async () => {
    try {
      const response = await presenceApi.getCurrent();
      setPresence(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load presence data');
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return <div className="loading">Loading presence board...</div>;
  }

  return (
    <div className="presence-board">
      <header className="board-header">
        <h1>Who's Here Right Now</h1>
        <p className="update-time">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="presence-grid">
        {presence.length === 0 ? (
          <div className="empty-state">
            <p>No one is currently checked in</p>
          </div>
        ) : (
          presence.map((person) => (
            <div key={person.sessionId} className="presence-card">
              <div className="alias">{person.displayName}</div>
              <div className="details">
                <div className="check-in-time">
                  In: {formatTime(person.checkInTime)}
                </div>
                <div className="duration">
                  {formatDuration(person.minutesOnsite)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default PresenceBoard;
