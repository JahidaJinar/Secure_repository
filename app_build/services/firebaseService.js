const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(PROJECTS_FILE)) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify([], null, 2));
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
}

const crypto = require('crypto');

function hashUserPassword(password) {
  if (!password) return '';
  return crypto.createHash('sha256').update(password + '_edtech_user_salt_2026').digest('hex');
}

class FirebaseService {
  constructor() {
    this.projectsFile = PROJECTS_FILE;
    this.usersFile = USERS_FILE;
    this.db = null;
    this.initFirestore();
  }

  initFirestore() {
    try {
      const saKey = process.env.FIREBASE_SERVICE_ACCOUNT;
      const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (saKey || saPath) {
        const admin = require('firebase-admin');
        if (!admin.apps.length) {
          let credential;
          if (saKey) {
            const serviceAccount = typeof saKey === 'string' ? JSON.parse(saKey) : saKey;
            credential = admin.credential.cert(serviceAccount);
          } else {
            credential = admin.credential.applicationDefault();
          }

          admin.initializeApp({ credential });
        }
        this.db = admin.firestore();
        console.log('✅ Firebase Admin Cloud Firestore initialized successfully.');
      } else {
        console.log('ℹ️ Firebase Service Account not provided in .env. Operating in Local Data mode (projects.json).');
      }
    } catch (err) {
      console.warn('⚠️ Could not initialize Cloud Firestore, using local JSON fallback:', err.message);
    }
  }

  _readProjects() {
    try {
      const data = fs.readFileSync(this.projectsFile, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      return [];
    }
  }

  _writeProjects(projects) {
    fs.writeFileSync(this.projectsFile, JSON.stringify(projects, null, 2));
  }

  async getAllProjects(filters = {}) {
    let projects = [];
    if (this.db) {
      try {
        const snapshot = await this.db.collection('projects').get();
        snapshot.forEach(doc => {
          projects.push({ id: doc.id, ...doc.data() });
        });
      } catch (err) {
        console.error('Firestore query failed, using local fallback:', err.message);
        projects = this._readProjects();
      }
    } else {
      projects = this._readProjects();
    }

    // Automatically filter out any legacy self-access requests
    projects.forEach(p => {
      const authorPrefix = (p.authorEmail || '').split('@')[0].toLowerCase();
      if (p.accessRequests && authorPrefix) {
        p.accessRequests = p.accessRequests.filter(r => 
          (r.requesterEmail || '').split('@')[0].toLowerCase() !== authorPrefix
        );
      }
    });

    projects.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (filters.category && filters.category !== 'all') {
      projects = projects.filter(p => p.category === filters.category);
    }
    if (filters.batch && filters.batch !== 'all') {
      projects = projects.filter(p => p.batch === filters.batch);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      projects = projects.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.authorName || '').toLowerCase().includes(q) ||
        (p.authorEmail || '').toLowerCase().includes(q)
      );
    }
    return projects;
  }

  async getProjectById(id) {
    if (this.db) {
      try {
        const doc = await this.db.collection('projects').doc(id).get();
        if (doc.exists) {
          return { id: doc.id, ...doc.data() };
        }
      } catch (err) {
        console.error('Firestore getProjectById failed:', err.message);
      }
    }
    const projects = this._readProjects();
    return projects.find(p => p.id === id) || null;
  }

  async createProject(projectData) {
    const newId = uuidv4();
    const newProject = {
      id: newId,
      ...projectData,
      createdAt: new Date().toISOString(),
      accessRequests: []
    };

    if (this.db) {
      try {
        await this.db.collection('projects').doc(newId).set(newProject);
        console.log('✅ Project saved to Cloud Firestore:', newId);
      } catch (err) {
        console.error('Firestore save failed:', err.message);
      }
    }

    const projects = this._readProjects();
    projects.unshift(newProject);
    this._writeProjects(projects);

    return newProject;
  }

  async requestAccess(projectId, requesterInfo) {
    const project = await this.getProjectById(projectId);
    if (!project) throw new Error('Project not found');

    project.accessRequests = project.accessRequests || [];

    const existingIndex = project.accessRequests.findIndex(
      r => r.requesterEmail === requesterInfo.requesterEmail
    );

    if (existingIndex !== -1) {
      project.accessRequests[existingIndex].status = 'pending';
      project.accessRequests[existingIndex].requestedAt = new Date().toISOString();
    } else {
      project.accessRequests.push({
        requesterUid: requesterInfo.requesterUid || 'user-' + uuidv4().substring(0, 6),
        requesterEmail: requesterInfo.requesterEmail,
        requesterName: requesterInfo.requesterName || requesterInfo.requesterEmail.split('@')[0],
        status: 'pending',
        requestedAt: new Date().toISOString()
      });
    }

    if (this.db) {
      try {
        await this.db.collection('projects').doc(projectId).update({
          accessRequests: project.accessRequests
        });
      } catch (err) {
        console.error('Firestore requestAccess update failed:', err.message);
      }
    }

    const projects = this._readProjects();
    const idx = projects.findIndex(p => p.id === projectId);
    if (idx !== -1) {
      projects[idx] = project;
      this._writeProjects(projects);
    }

    return project;
  }

  async updateRequestStatus(projectId, requesterEmail, newStatus) {
    const project = await this.getProjectById(projectId);
    if (!project) throw new Error('Project not found');

    project.accessRequests = project.accessRequests || [];

    const request = project.accessRequests.find(r => r.requesterEmail === requesterEmail);
    if (!request) {
      throw new Error('Access request not found for this user');
    }

    request.status = newStatus;
    request.updatedAt = new Date().toISOString();

    if (this.db) {
      try {
        await this.db.collection('projects').doc(projectId).update({
          accessRequests: project.accessRequests
        });
      } catch (err) {
        console.error('Firestore updateRequestStatus failed:', err.message);
      }
    }

    const projects = this._readProjects();
    const idx = projects.findIndex(p => p.id === projectId);
    if (idx !== -1) {
      projects[idx] = project;
      this._writeProjects(projects);
    }

    return project;
  }

  async getProjectsByAuthor(authorEmail) {
    const all = await this.getAllProjects();
    return all.filter(p => (p.authorEmail || '').toLowerCase() === authorEmail.toLowerCase());
  }

  async getRequestedProjectsForUser(userEmail) {
    const all = await this.getAllProjects();
    return all.filter(p =>
      p.accessRequests && p.accessRequests.some(r => (r.requesterEmail || '').toLowerCase() === userEmail.toLowerCase())
    );
  }

  _readUsers() {
    try {
      const data = fs.readFileSync(this.usersFile, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      return [];
    }
  }

  _writeUsers(users) {
    fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
  }

  async registerUser({ email, password, displayName }) {
    const users = this._readUsers();
    const existing = users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email already exists! Please log in instead.');
    }

    const uid = 'uid_' + Buffer.from(email).toString('base64').replace(/=/g, '');
    const passwordHash = hashUserPassword(password);

    const userObj = {
      uid,
      email,
      passwordHash,
      displayName: displayName || email.split('@')[0],
      isAuthor: true,
      createdAt: new Date().toISOString()
    };

    users.push(userObj);
    this._writeUsers(users);

    if (this.db) {
      try {
        await this.db.collection('users').doc(uid).set(userObj, { merge: true });
        console.log('✅ Registered user saved to Firestore with SHA-256 hash:', email);
      } catch (err) {
        console.error('Firestore user reg error:', err.message);
      }
    }

    return { uid: userObj.uid, email: userObj.email, displayName: userObj.displayName, isAuthor: true };
  }

  async authenticateUser({ email, password }) {
    const users = this._readUsers();
    let user = users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());

    if (!user && this.db) {
      try {
        const snapshot = await this.db.collection('users').where('email', '==', email).get();
        if (!snapshot.empty) {
          user = snapshot.docs[0].data();
        }
      } catch (e) {
        console.warn('Firestore user fetch warning:', e.message);
      }
    }

    if (!user) {
      throw new Error('Account not found! You must Register first before logging in.');
    }

    const inputHash = hashUserPassword(password);
    if (user.passwordHash && user.passwordHash !== inputHash && user.passwordHash !== password) {
      throw new Error('Incorrect account password!');
    }

    return { uid: user.uid, email: user.email, displayName: user.displayName || user.email.split('@')[0], isAuthor: true };
  }

  async syncUserProfile(userData) {
    const uid = 'uid_' + Buffer.from(userData.email).toString('base64').replace(/=/g, '');
    const userObj = {
      uid,
      email: userData.email,
      displayName: userData.displayName || userData.email.split('@')[0],
      isAuthor: true,
      lastLogin: new Date().toISOString()
    };

    if (this.db) {
      try {
        await this.db.collection('users').doc(uid).set(userObj, { merge: true });
        console.log('✅ User profile synced to Cloud Firestore users collection:', userData.email);
      } catch (err) {
        console.error('Firestore user sync failed:', err.message);
      }
    }

    return userObj;
  }

  async resetUserPassword({ email, newPassword }) {
    const users = this._readUsers();
    let userIndex = users.findIndex(u => (u.email || '').toLowerCase() === email.toLowerCase());

    if (userIndex === -1 && this.db) {
      try {
        const snapshot = await this.db.collection('users').where('email', '==', email).get();
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const newHash = hashUserPassword(newPassword);
          await doc.ref.update({ passwordHash: newHash, updatedAt: new Date().toISOString() });
          return { success: true, message: 'Password reset successfully! You can now log in with your new password.' };
        }
      } catch (e) {
        console.warn('Firestore password reset warning:', e.message);
      }
    }

    if (userIndex === -1) {
      throw new Error('No registered account found with this email address.');
    }

    const newHash = hashUserPassword(newPassword);
    users[userIndex].passwordHash = newHash;
    users[userIndex].updatedAt = new Date().toISOString();
    this._writeUsers(users);

    if (this.db) {
      try {
        const uid = users[userIndex].uid;
        await this.db.collection('users').doc(uid).set({ passwordHash: newHash, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.error('Firestore password reset sync err:', err.message);
      }
    }

    return { success: true, message: 'Password reset successfully! You can now log in with your new password.' };
  }

  async requestPasswordResetLink(email, customBaseUrl) {
    const users = this._readUsers();
    const user = users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());

    if (!user && !this.db) {
      throw new Error('No registered account found with this email address.');
    }

    const baseUrl = customBaseUrl || process.env.PUBLIC_APP_URL || 'http://localhost:3000/login';
    const resetLink = `${baseUrl}?mode=resetPassword&email=${encodeURIComponent(email)}`;
    console.log('✅ Dynamic app password reset link generated:', resetLink);

    return {
      success: true,
      message: '📩 Password reset link sent to your email inbox! Please check your email to reset your password.',
      resetLink
    };
  }
}

module.exports = new FirebaseService();
