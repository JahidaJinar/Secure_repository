import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppAuth } from '../utils/firebaseConfig';

export default function Navbar() {
  const location = useLocation();
  const user = AppAuth.getCurrentUser();

  const handleLogout = () => {
    AppAuth.logout();
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <div className="brand-icon">🛡️</div>
        <span className="brand-title">EdTech Secure Repo</span>
      </Link>

      <ul className="nav-links">
        <li>
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            📁 Repository
          </Link>
        </li>
        <li>
          <Link to="/upload" className={`nav-link ${location.pathname === '/upload' ? 'active' : ''}`}>
            🔒 Upload Project
          </Link>
        </li>
        <li>
          <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            📊 Dashboard
          </Link>
        </li>
        <li>
          {user ? (
            <div className="user-profile-badge">
              <span>👤 {user.displayName} ({user.email})</span>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
              Login / Register
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
