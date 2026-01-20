import React from 'react';
import { Link } from 'react-router-dom';
import './AdminNav.css';

export default function AdminNav() {
  return (
    <nav className="admin-nav">
      <ul className="admin-nav-list">
        <li>
          <Link to="/admin" className="admin-nav-link">
            ⚙️ Dashboard
          </Link>
        </li>
        <li>
          <Link to="/reports" className="admin-nav-link">
            📊 Reports
          </Link>
        </li>
        <li>
          <Link to="/leaderboard" className="admin-nav-link">
            🏆 Leaderboard
          </Link>
        </li>
        <li>
          <Link to="/core-hours" className="admin-nav-link">
            ⏰ Core Hours
          </Link>
        </li>
        <li>
          <Link to="/presence" className="admin-nav-link">
            👥 Presence Board
          </Link>
        </li>
      </ul>
    </nav>
  );
}
