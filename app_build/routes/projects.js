const express = require('express');
const router = express.Router();
const firebaseService = require('../services/firebaseService');
const emailService = require('../services/emailService');

// Get all projects with optional category, batch, and search filter
router.get('/', async (req, res) => {
  try {
    const { category, batch, search } = req.query;
    const projects = await firebaseService.getAllProjects({ category, batch, search });
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get author's dashboard projects & incoming requests
router.get('/author/:email', async (req, res) => {
  try {
    const authorProjects = await firebaseService.getProjectsByAuthor(req.params.email);
    res.json({ success: true, projects: authorProjects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get requests submitted by a user
router.get('/user-requests/:email', async (req, res) => {
  try {
    const requestedProjects = await firebaseService.getRequestedProjectsForUser(req.params.email);
    res.json({ success: true, projects: requestedProjects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Register user account
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.json({ success: false, message: 'Email and password required' });
    }
    const user = await firebaseService.registerUser({ email, password, displayName });
    res.json({ success: true, user });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// Login user account
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({ success: false, message: 'Email and password required' });
    }
    const user = await firebaseService.authenticateUser({ email, password });
    res.json({ success: true, user });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// Reset user password
router.post('/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.json({ success: false, message: 'Email and new password are required' });
    }
    const result = await firebaseService.resetUserPassword({ email: email.trim(), newPassword: newPassword.trim() });
    if (result.success) {
      emailService.sendPasswordResetNotificationEmail(email.trim(), newPassword.trim());
    }
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// Sync user to Firebase Auth so Firebase can send password reset email
router.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.json({ success: false, message: 'Department email is required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check user exists in our local system
    const users = firebaseService._readUsers();
    const localUser = users.find(u => (u.email || '').toLowerCase() === trimmedEmail);
    if (!localUser) {
      return res.json({ success: false, message: 'No registered account found with this email address.' });
    }

    // Sync user to Firebase Auth (so Firebase can send password reset email)
    try {
      const admin = require('firebase-admin');
      if (admin.auth) {
        try {
          await admin.auth().getUserByEmail(trimmedEmail);
          console.log('✅ User already exists in Firebase Auth:', trimmedEmail);
        } catch (e) {
          // Create in Firebase Auth if not exists
          await admin.auth().createUser({
            email: trimmedEmail,
            displayName: localUser.displayName || trimmedEmail,
            emailVerified: false
          });
          console.log('✅ User created in Firebase Auth:', trimmedEmail);
        }
      }
    } catch (syncErr) {
      console.warn('Firebase Auth sync warning:', syncErr.message);
    }

    // Return success - client will call Firebase sendPasswordResetEmail
    res.json({
      success: true,
      firebaseReady: true,
      message: 'Account verified. Sending Firebase reset email...'
    });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.json({ success: false, message: err.message });
  }
});

// Sync user profile to Firestore users collection
router.post('/users/sync', async (req, res) => {
  try {
    const { email, displayName } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }
    const user = await firebaseService.syncUserProfile({ email, displayName });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await firebaseService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create new project metadata
router.post('/', async (req, res) => {
  try {
    const { title, category, batch, description, authorUid, authorEmail, authorName, fileId, fileName, driveUrl, passwordKey } = req.body;
    
    if (!title || !category || !batch || !fileId || !authorEmail) {
      return res.status(400).json({ success: false, message: 'Missing required project fields' });
    }

    const newProject = await firebaseService.createProject({
      title,
      category,
      batch,
      description: description || '',
      authorUid: authorUid || 'anon-uid',
      authorEmail,
      authorName: authorName || authorEmail.split('@')[0],
      fileId,
      fileName,
      driveUrl,
      passwordKey: passwordKey || ''
    });

    res.status(201).json({ success: true, project: newProject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Submit access request for a project
router.post('/:id/request-access', async (req, res) => {
  try {
    const { requesterUid, requesterEmail, requesterName } = req.body;

    if (!requesterEmail) {
      return res.status(400).json({ success: false, message: 'Requester email is required' });
    }

    const updatedProject = await firebaseService.requestAccess(req.params.id, {
      requesterUid,
      requesterEmail,
      requesterName
    });

    // Send email notification to author
    emailService.sendAccessRequestEmail(updatedProject.authorEmail, requesterEmail, updatedProject.title);

    res.json({ success: true, message: 'Access request submitted successfully', project: updatedProject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Author approves or rejects an access request
router.post('/:id/update-request', async (req, res) => {
  try {
    const { requesterEmail, status } = req.body;

    if (!requesterEmail || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status or missing requester email' });
    }

    const updatedProject = await firebaseService.updateRequestStatus(
      req.params.id,
      requesterEmail,
      status
    );

    // Send email notification to requester
    if (status === 'approved') {
      emailService.sendApprovalNotificationEmail(requesterEmail, updatedProject.title, updatedProject.authorEmail);
    } else if (status === 'rejected') {
      emailService.sendRejectionNotificationEmail(requesterEmail, updatedProject.title, updatedProject.authorEmail);
    }

    res.json({ success: true, message: `Request status updated to ${status}`, project: updatedProject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
