import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppAuth } from '../utils/firebaseConfig';

export default function Login({ showToast }) {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/projects/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword.trim() })
      });

      if (!res.ok) {
        showToast('❌ Server Offline. Please run npm run dev in your terminal.', 'error');
        return;
      }

      const data = await res.json();
      if (!data.success) {
        showToast('❌ ' + data.message, 'error');
        return;
      }

      AppAuth.setCurrentUser(data.user);
      showToast('Logged in successfully! Redirecting...', 'success');
      setTimeout(() => {
        navigate('/');
      }, 800);

    } catch (err) {
      console.error('Login error:', err);
      showToast('❌ Login Error: ' + err.message, 'error');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword.trim()) {
      showToast('Please provide email and password.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/projects/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail.trim(), password: regPassword.trim(), displayName: regName.trim() })
      });

      if (!res.ok) {
        showToast('❌ Server Offline. Please run npm run dev in your terminal.', 'error');
        return;
      }

      const data = await res.json();
      if (!data.success) {
        showToast('❌ ' + data.message, 'error');
        return;
      }

      AppAuth.setCurrentUser(data.user);
      showToast('🎉 Account registered successfully! Redirecting...', 'success');
      setTimeout(() => {
        navigate('/');
      }, 800);

    } catch (err) {
      console.error('Registration error:', err);
      showToast('❌ Registration Error: ' + err.message, 'error');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '480px', paddingTop: '3rem' }}>
      {!isRegister ? (
        <div className="dash-section">
          <div className="dash-title">🔐 Firebase User Authentication</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Sign in to upload projects, manage requests, or access authorized files.
          </p>

          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Department Email Address</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="form-input"
                placeholder="e.g. author@dept.edu.bd"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Log In
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
            >
              Register Here
            </button>
          </div>
        </div>
      ) : (
        <div className="dash-section">
          <div className="dash-title">👤 Create Student / Faculty Account</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Register your account to author projects and manage access requests.
          </p>

          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="form-input"
                placeholder="e.g. Tanvir Ahmed"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="form-input"
                placeholder="student@dept.edu.bd"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="form-input"
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '1rem' }}>
              Create Account
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Already registered?{' '}
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
            >
              Log In
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
