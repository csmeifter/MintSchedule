// app.js – main entry point; wires together all modules

document.addEventListener('DOMContentLoaded', () => {
  // ── Elements ─────────────────────────────────────────────────────
  const appEl        = document.getElementById('app');
  const authView     = document.getElementById('auth-view');
  const mainContent  = document.getElementById('main-content');

  // Auth form
  const authForm     = document.getElementById('auth-form');
  const authEmail    = document.getElementById('auth-email');
  const authPassword = document.getElementById('auth-password');
  const authSubmit   = document.getElementById('auth-submit');
  const authError    = document.getElementById('auth-error');
  const authToggle   = document.getElementById('auth-mode-toggle');
  const authTitle    = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');

  // Nav
  const navCalendar      = document.getElementById('nav-calendar');
  const navAutomations   = document.getElementById('nav-automations');
  const navNotifications = document.getElementById('nav-notifications');
  const navLogout        = document.getElementById('nav-logout');

  // Views
  const calendarView     = document.getElementById('calendar-view');
  const automationsView  = document.getElementById('automations-view');
  const notificationsView= document.getElementById('notifications-view');

  // Calendar
  const calGrid       = document.getElementById('calendar-grid');
  const calTitle      = document.getElementById('calendar-title');
  const calPrev       = document.getElementById('cal-prev');
  const calNext       = document.getElementById('cal-next');

  // Event form
  const addEventBtn   = document.getElementById('add-event-btn');
  const eventFormCont = document.getElementById('event-form-container');
  const eventForm     = document.getElementById('event-form');
  const eventDateInp  = document.getElementById('event-date');
  const eventTitleInp = document.getElementById('event-title');
  const eventTimeInp  = document.getElementById('event-time');
  const eventNoteInp  = document.getElementById('event-note');
  const eventCancel   = document.getElementById('event-cancel');
  const eventsList    = document.getElementById('events-list');

  // Automations
  const automationsList = document.getElementById('automations-list');

  // Notifications
  const notifList   = document.getElementById('notifications-list');
  const notifBadge  = document.getElementById('notif-badge');

  // ── Auth state ───────────────────────────────────────────────────
  let isLoginMode = true;

  function showApp() {
    authView.classList.add('hidden');
    mainContent.classList.remove('hidden');
    showView('calendar');
  }

  function showAuth() {
    mainContent.classList.add('hidden');
    authView.classList.remove('hidden');
  }

  // Check existing session
  if (Auth.currentUser()) {
    showApp();
  } else {
    showAuth();
  }

  // Toggle login / signup
  authToggle.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    authTitle.textContent    = isLoginMode ? 'Welcome back' : 'Create account';
    authSubtitle.textContent = isLoginMode ? 'Sign in to MintSchedule' : 'Join MintSchedule';
    authSubmit.textContent   = isLoginMode ? 'Sign in' : 'Sign up';
    authToggle.innerHTML     = isLoginMode
      ? 'Don\'t have an account? <a>Sign up</a>'
      : 'Already have an account? <a>Sign in</a>';
    authError.textContent = '';
  });

  authForm.addEventListener('submit', e => {
    e.preventDefault();
    authError.textContent = '';
    const email    = authEmail.value.trim();
    const password = authPassword.value;

    const result = isLoginMode
      ? Auth.login(email, password)
      : Auth.register(email, password);

    if (result.ok) {
      Notifications.add('Welcome to MintSchedule! 🌿');
      showApp();
    } else {
      authError.textContent = result.error;
    }
  });

  navLogout.addEventListener('click', () => {
    Auth.logout();
    showAuth();
  });

  // ── Navigation ───────────────────────────────────────────────────
  function showView(name) {
    [calendarView, automationsView, notificationsView].forEach(v => v.classList.remove('active'));
    [navCalendar, navAutomations, navNotifications].forEach(b => b.classList.remove('active'));

    if (name === 'calendar') {
      calendarView.classList.add('active');
      navCalendar.classList.add('active');
      renderCalendar();
    } else if (name === 'automations') {
      automationsView.classList.add('active');
      navAutomations.classList.add('active');
      Automation.render(automationsList);
    } else if (name === 'notifications') {
      notificationsView.classList.add('active');
      navNotifications.classList.add('active');
      Notifications.render(notifList, notifBadge);
    }
  }

  navCalendar.addEventListener('click',      () => showView('calendar'));
  navAutomations.addEventListener('click',   () => showView('automations'));
  navNotifications.addEventListener('click', () => showView('notifications'));

  // ── Calendar ─────────────────────────────────────────────────────
  let selectedDate = null;

  Calendar.onDayClick(dateStr => {
    selectedDate = dateStr;
    eventDateInp.value = dateStr;
    eventFormCont.classList.remove('hidden');
    eventTitleInp.focus();
    renderEventsList(dateStr);
  });

  calPrev.addEventListener('click', () => {
    Calendar.prevMonth();
    renderCalendar();
  });

  calNext.addEventListener('click', () => {
    Calendar.nextMonth();
    renderCalendar();
  });

  function _todayStr() {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  }

  addEventBtn.addEventListener('click', () => {
    selectedDate = _todayStr();
    eventDateInp.value = selectedDate;
    eventFormCont.classList.remove('hidden');
    eventTitleInp.focus();
  });

  eventCancel.addEventListener('click', () => {
    eventFormCont.classList.add('hidden');
    eventForm.reset();
  });

  eventForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = eventTitleInp.value.trim();
    if (!title) return;

    const event = Calendar.addEvent({
      title,
      date:  eventDateInp.value,
      time:  eventTimeInp.value,
      note:  eventNoteInp.value.trim(),
    });

    Notifications.add(`Event added: "${event.title}" on ${event.date}`);
    Notifications.render(notifList, notifBadge);

    eventForm.reset();
    eventFormCont.classList.add('hidden');
    renderCalendar();
    if (selectedDate) renderEventsList(selectedDate);
  });

  function renderCalendar() {
    Calendar.render(calGrid, calTitle);
  }

  function renderEventsList(dateStr) {
    const events = Calendar.getEventsForDate(dateStr);
    eventsList.innerHTML = '';

    const heading = document.createElement('h3');
    heading.textContent = `Events on ${dateStr}`;
    eventsList.appendChild(heading);

    if (!events.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No events. Click a day or use "Add Event" to create one.';
      eventsList.appendChild(empty);
      return;
    }

    events.forEach(ev => {
      const card = document.createElement('div');
      card.className = 'event-card';
      card.innerHTML = `
        <div>
          <div class="event-title">${_esc(ev.title)}</div>
          <div class="event-time">${ev.time ? '🕐 ' + _esc(ev.time) : 'All day'}${ev.note ? ' — ' + _esc(ev.note) : ''}</div>
        </div>
        <div class="event-actions">
          <button data-id="${_esc(ev.id)}" title="Delete">🗑</button>
        </div>`;

      card.querySelector('button').addEventListener('click', function () {
        Calendar.deleteEvent(this.dataset.id);
        renderCalendar();
        renderEventsList(dateStr);
      });

      eventsList.appendChild(card);
    });
  }

  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Initial badge update
  Notifications.render(notifList, notifBadge);
});
