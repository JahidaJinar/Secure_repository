import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppAuth } from '../utils/firebaseConfig';

export default function Login({ showToast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, setViewMode] = useState('login'); // 'login' | 'register' | 'reset' | 'resetConfirm'

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Reset password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'resetPassword' || params.get('email')) {
      setViewMode('resetConfirm');
      if (params.get('email')) {
        setResetEmail(params.get('email'));
      }
    }
  }, [location]);

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

  const handleResetRequestSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      showToast('Please enter your registered email address.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/projects/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() })
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        showToast('❌ Server Error. Please try again.', 'error');
        return;
      }

      if (!data.success) {
        showToast('❌ ' + (data.message || 'Failed to send reset email'), 'error');
        return;
      }

      showToast('📩 ' + data.message, 'success');
      setViewMode('login');
      setLoginEmail(resetEmail.trim());
    } catch (err) {
      console.error('Password reset request error:', err);
      showToast('❌ Reset Error: ' + err.message, 'error');
    }
  };

  const handleResetConfirmSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetNewPassword.trim()) {
      showToast('Please enter your email and new password.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/projects/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim(), newPassword: resetNewPassword.trim() })
      });

      const data = await res.json();
      if (!data.success) {
        showToast('❌ ' + (data.message || 'Failed to reset password'), 'error');
        return;
      }

      showToast('🔑 ' + data.message, 'success');
      setViewMode('login');
      setLoginEmail(resetEmail.trim());
      setLoginPassword(resetNewPassword.trim());
    } catch (err) {
      console.error('Password reset confirm error:', err);
      showToast('❌ Reset Error: ' + err.message, 'error');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '480px', paddingTop: '3rem' }}>
      {viewMode === 'login' && (
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

            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => { setResetEmail(loginEmail); setViewMode('reset'); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Log In
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setViewMode('register')}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
            >
              Register Here
            </button>
          </div>
        </div>
      )}

      {viewMode === 'register' && (
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
              onClick={() => setViewMode('login')}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
            >
              Log In
            </button>
          </div>
        </div>
      )}

      {viewMode === 'reset' && (
        <div className="dash-section">
          <div className="dash-title">🔑 Forgot Account Password</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Enter your registered department email address below. We will send an official password reset link directly to your email inbox.
          </p>

          <form onSubmit={handleResetRequestSubmit}>
            <div className="form-group">
              <label className="form-label">Registered Department Email</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="form-input"
                placeholder="e.g. jahida0001@std.uftb.ac.bd"
                required
              />
            </div>

            <button type="submit" className="btn btn-accent" style={{ width: '100%', marginTop: '1rem' }}>
              📩 Send Password Reset Link to Email
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Remembered your password?{' '}
            <button
              type="button"
              onClick={() => setViewMode('login')}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
            >
              Back to Login
            </button>
          </div>
        </div>
      )}

      {viewMode === 'resetConfirm' && (
        <div className="dash-section">
          <div className="dash-title">🔑 Set New Account Password</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Setting a new password for <strong>{resetEmail || 'your account'}</strong>.
          </p>

          <form onSubmit={handleResetConfirmSubmit}>
            <div className="form-group">
              <label className="form-label">Department Email</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="form-input"
                placeholder="e.g. jahida0001@std.uftb.ac.bd"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Type New Password</label>
              <input
                type="password"
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your new password..."
                required
              />
            </div>

            <button type="submit" className="btn btn-accent" style={{ width: '100%', marginTop: '1rem' }}>
              🔑 Save New Password
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Remembered your password?{' '}
            <button
              type="button"
              onClick={() => setViewMode('login')}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
