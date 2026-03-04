/* ══════════════════════════════════════
   MintSchedule — Auth Module
   Uses localStorage as a simple user store
   ══════════════════════════════════════ */

const Auth = (() => {

  const USERS_KEY   = 'ms_users';
  const SESSION_KEY = 'ms_session';

  function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function currentUser() {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    return getUsers().find(u => u.id === id) || null;
  }

  function register(name, email, password) {
    const users = getUsers();
    if (users.find(u => u.email === email)) {
      return { ok: false, error: 'An account with that email already exists.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }
    const user = { id: crypto.randomUUID(), name, email, password };
    users.push(user);
    saveUsers(users);
    localStorage.setItem(SESSION_KEY, user.id);
    return { ok: true, user };
  }

  function login(email, password) {
    const users = getUsers();
    const user  = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return { ok: false, error: 'Invalid email or password.' };
    }
    localStorage.setItem(SESSION_KEY, user.id);
    return { ok: true, user };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  return { register, login, logout, currentUser };
})();

/* ── UI wiring ───────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  const authScreen = document.getElementById('auth-screen');
  const appScreen  = document.getElementById('app-screen');

  /* Tab switching */
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-form`).classList.add('active');
    });
  });

  /* Login */
  document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const result   = Auth.login(email, password);
    if (!result.ok) {
      showAuthError('login-error', result.error);
    } else {
      showApp(result.user);
    }
  });

  /* Register */
  document.getElementById('register-form').addEventListener('submit', e => {
    e.preventDefault();
    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const result   = Auth.register(name, email, password);
    if (!result.ok) {
      showAuthError('register-error', result.error);
    } else {
      showApp(result.user);
    }
  });

  /* Logout */
  document.getElementById('logout-btn').addEventListener('click', () => {
    Auth.logout();
    authScreen.classList.add('active');
    appScreen.classList.remove('active');
    document.getElementById('login-email').value    = '';
    document.getElementById('login-password').value = '';
  });

  /* Auto-login if session exists */
  const user = Auth.currentUser();
  if (user) {
    showApp(user);
  }

  function showApp(user) {
    authScreen.classList.remove('active');
    appScreen.classList.add('active');
    document.getElementById('user-name-display').textContent = user.name;
    document.getElementById('user-avatar').textContent       = user.name.charAt(0).toUpperCase();
    // Signal rest of app that user is ready
    document.dispatchEvent(new CustomEvent('ms:ready', { detail: { user } }));
  }

  function showAuthError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
  }
});
