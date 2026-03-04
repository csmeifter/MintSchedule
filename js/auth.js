// auth.js – simple local-storage-based auth (demo only)
// WARNING: passwords are stored in plain text for demo purposes only.
// Never use this approach in a real application; use a proper backend with hashed credentials.

const Auth = (() => {
  const STORAGE_KEY = 'mintschedule_users';
  const SESSION_KEY = 'mintschedule_session';

  function _getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function _saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  function register(email, password) {
    const users = _getUsers();
    if (users[email]) {
      return { ok: false, error: 'An account with that email already exists.' };
    }
    users[email] = { email, password };
    _saveUsers(users);
    _setSession(email);
    return { ok: true };
  }

  function login(email, password) {
    const users = _getUsers();
    if (!users[email]) {
      return { ok: false, error: 'No account found. Please sign up first.' };
    }
    if (users[email].password !== password) {
      return { ok: false, error: 'Incorrect password.' };
    }
    _setSession(email);
    return { ok: true };
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function currentUser() {
    return sessionStorage.getItem(SESSION_KEY) || null;
  }

  function _setSession(email) {
    sessionStorage.setItem(SESSION_KEY, email);
  }

  return { register, login, logout, currentUser };
})();
