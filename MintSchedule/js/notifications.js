/* ══════════════════════════════════════
   MintSchedule — Notifications Module
   ══════════════════════════════════════ */

const Notifications = (() => {

  const key = () => `ms_reminders_${Auth.currentUser()?.id}`;

  function getReminders() { return JSON.parse(localStorage.getItem(key()) || '[]'); }
  function saveReminders(r) { localStorage.setItem(key(), JSON.stringify(r)); }

  function add(reminder) {
    const reminders = getReminders();
    reminders.unshift(reminder);
    saveReminders(reminders);
    render();
    updateBadge();
  }

  function dismiss(id) {
    saveReminders(getReminders().filter(r => r.id !== id));
    render();
    updateBadge();
  }

  function clearAll() {
    saveReminders([]);
    render();
    updateBadge();
  }

  /**
   * Schedule a reminder for a calendar event.
   * Uses the browser's Notification API when available.
   */
  function schedule(evt) {
    if (!evt.reminder) return;

    const evtDate     = new Date(`${evt.date}T${evt.time}`);
    const offsetMs    = (evt.reminderOffset || 0) * 60 * 1000;
    const triggerTime = new Date(evtDate.getTime() - offsetMs);
    const now         = new Date();
    const delay       = triggerTime - now;

    if (delay < 0) return; // already passed

    setTimeout(() => {
      const reminderObj = {
        id:    crypto.randomUUID(),
        title: evt.title,
        body:  evt.reminderOffset > 0
          ? `Starting in ${evt.reminderOffset} minute${evt.reminderOffset > 1 ? 's' : ''}`
          : 'Starting now',
        time:  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      add(reminderObj);
      Toast.show(`🔔 Reminder: ${evt.title}`, 'info');

      /* Browser push notification */
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`🌿 MintSchedule`, {
          body: `${evt.title} — ${reminderObj.body}`,
          icon: 'https://em-content.zobj.net/source/microsoft-teams/363/herb_1f33f.png',
        });
      }
    }, delay);
  }

  function requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function render() {
    const list  = document.getElementById('reminders-list');
    const empty = document.getElementById('reminders-empty');
    if (!list) return;
    list.innerHTML = '';

    const reminders = getReminders();
    if (reminders.length === 0) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    reminders.forEach(r => {
      const item = document.createElement('div');
      item.className = 'reminder-item';
      item.innerHTML = `
        <div class="reminder-icon">🔔</div>
        <div class="reminder-info">
          <div class="reminder-title">${escHtml(r.title)}</div>
          <div class="reminder-time">${escHtml(r.body || '')} · ${r.time || ''}</div>
        </div>
        <button class="reminder-dismiss" title="Dismiss">✕</button>
      `;
      item.querySelector('.reminder-dismiss').addEventListener('click', () => dismiss(r.id));
      list.appendChild(item);
    });
  }

  function updateBadge() {
    const badge = document.getElementById('reminder-badge');
    const count = getReminders().length;
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  return {
    init() {
      render();
      updateBadge();
      requestPermission();

      document.getElementById('btn-clear-reminders').addEventListener('click', () => {
        clearAll();
        Toast.show('All reminders cleared', 'info');
      });
    },
    add,
    schedule,
    render,
    updateBadge,
  };
})();
