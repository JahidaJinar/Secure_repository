export const firebaseConfig = {
  apiKey: "AIzaSyBREB8RUEKJPzePJm4eB4PCEzeqB6c_tuk",
  authDomain: "edterepository.firebaseapp.com",
  projectId: "edterepository",
  storageBucket: "edterepository.firebasestorage.app",
  messagingSenderId: "544171006717",
  appId: "1:544171006717:web:25644b59149d618fe4bc94"
};

export const AppAuth = {
  getCurrentUser() {
    const userStr = localStorage.getItem('edtech_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  setCurrentUser(userObj) {
    if (userObj) {
      localStorage.setItem('edtech_user', JSON.stringify(userObj));
    } else {
      localStorage.removeItem('edtech_user');
    }
  },

  login(email, password) {
    const userObj = {
      uid: 'uid_' + btoa(email).replace(/=/g, ''),
      email: email,
      displayName: email.split('@')[0],
      isAuthor: true,
      loginTime: new Date().toISOString()
    };
    this.setCurrentUser(userObj);
    return userObj;
  },

  register(email, password, displayName) {
    const userObj = {
      uid: 'uid_' + btoa(email).replace(/=/g, ''),
      email: email,
      displayName: displayName || email.split('@')[0],
      isAuthor: true,
      loginTime: new Date().toISOString()
    };
    this.setCurrentUser(userObj);
    return userObj;
  },

  logout() {
    localStorage.removeItem('edtech_user');
    window.location.href = '/login';
  }
};
