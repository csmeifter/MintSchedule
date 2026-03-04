// notifications.js – in-app notification management

const Notifications = (() => {
  const STORAGE_KEY = 'mintschedule_notifications';

  function _load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function _save(notifs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
  }

  function add(text) {
    const notifs = _load();
    notifs.unshift({
      id: Date.now().toString(36),
      text,
      time: new Date().toISOString(),
      read: false,
    });
    _save(notifs);
  }

  function dismiss(id) {
    _save(_load().filter(n => n.id !== id));
  }

  function markAllRead() {
    const notifs = _load().map(n => ({ ...n, read: true }));
    _save(notifs);
  }

  function unreadCount() {
    return _load().filter(n => !n.read).length;
  }

  function _formatTime(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function render(containerEl, badgeEl) {
    const notifs = _load();

    // Update badge
    const count = notifs.filter(n => !n.read).length;
    if (badgeEl) {
      badgeEl.textContent = count > 0 ? count : '';
      badgeEl.style.display = count > 0 ? 'inline' : 'none';
    }

    containerEl.innerHTML = '';

    if (!notifs.length) {
      containerEl.innerHTML = '<p class="empty-state">No notifications.</p>';
      return;
    }

    notifs.forEach(notif => {
      const card = document.createElement('div');
      card.className = 'notif-card' + (notif.read ? '' : ' unread');
      card.innerHTML = `
        <div>
          <div class="notif-text">${_esc(notif.text)}</div>
          <div class="notif-time">${_formatTime(notif.time)}</div>
        </div>
        <button class="dismiss-btn" data-id="${_esc(notif.id)}" title="Dismiss">✕</button>`;

      card.querySelector('.dismiss-btn').addEventListener('click', function () {
        dismiss(this.dataset.id);
        render(containerEl, badgeEl);
      });

      containerEl.appendChild(card);
    });

    markAllRead();
    if (badgeEl) badgeEl.style.display = 'none';
  }

  return { add, dismiss, markAllRead, unreadCount, render };
})();
