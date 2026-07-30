import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppAuth } from '../utils/firebaseConfig';

export default function Navbar() {
  const location = useLocation();
  const user = AppAuth.getCurrentUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    AppAuth.logout();
    setIsMenuOpen(false);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand" onClick={closeMenu}>
        <div className="brand-icon">🛡️</div>
        <span className="brand-title">EdTech Secure Repo</span>
      </Link>

      <button
        className="hamburger-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        {isMenuOpen ? '✕' : '☰'}
      </button>

      <ul className={`nav-links ${isMenuOpen ? 'mobile-open' : ''}`}>
        <li>
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={closeMenu}
          >
            📁 Repository
          </Link>
        </li>
        <li>
          <Link
            to="/upload"
            className={`nav-link ${location.pathname === '/upload' ? 'active' : ''}`}
            onClick={closeMenu}
          >
            🔒 Upload Project
          </Link>
        </li>
        <li>
          <Link
            to="/dashboard"
            className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            onClick={closeMenu}
          >
            📊 Dashboard
          </Link>
        </li>
        <li>
          {user ? (
            <div className="user-profile-badge">
              <span className="user-info-text">👤 {user.displayName} ({user.email})</span>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}>
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              onClick={closeMenu}
            >
              Login / Register
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
