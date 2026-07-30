import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import Repository from './pages/Repository';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

export default function App() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Repository showToast={showToast} />} />
          <Route path="/upload" element={<Upload showToast={showToast} />} />
          <Route path="/dashboard" element={<Dashboard showToast={showToast} />} />
          <Route path="/login" element={<Login showToast={showToast} />} />
        </Routes>
      </div>

      <Toast toast={toast} />

      <footer className="footer">
        EdTech Secure Project Repository &copy; 2026 Department of EdTech. Client-Side AES-256 Encrypted & Author Authorized.
      </footer>
    </div>
  );
}
