require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const projectRoutes = require('./routes/projects');
const driveRoutes = require('./routes/drive');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from React build (dist) or public
const fs = require('fs');
const distPath = path.join(__dirname, 'dist');
const publicPath = path.join(__dirname, 'public');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}
app.use(express.static(publicPath));

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/drive', driveRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'EdTech Secure Project Repository (React)',
    timestamp: new Date().toISOString()
  });
});

// Fallback to React index.html for SPA routing
app.get('*', (req, res) => {
  if (req.accepts('html')) {
    const reactIndex = path.join(distPath, 'index.html');
    if (fs.existsSync(reactIndex)) {
      return res.sendFile(reactIndex);
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'Not Found' });
  }
});

// Start Server
app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`====================================================`);
  console.log(`🚀 EdTech Secure Project Repository server running!`);
  console.log(`🌐 Local URL: ${url}`);
  console.log(`🔐 Zero-Knowledge AES-256 Client Encryption Enabled`);
  console.log(`====================================================`);
});
