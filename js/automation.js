// automation.js – simple automation rules (demo)

const Automation = (() => {
  const STORAGE_KEY = 'mintschedule_automations';

  const DEFAULTS = [
    {
      id: 'auto-morning',
      title: 'Morning Briefing',
      description: 'Show upcoming events 30 min after first event of the day.',
      enabled: false,
    },
    {
      id: 'auto-lights',
      title: 'Smart Lights',
      description: 'Turn on desk lamp when a work event starts.',
      enabled: false,
    },
    {
      id: 'auto-focus',
      title: 'Focus Mode',
      description: 'Mute notifications during events tagged "focus".',
      enabled: false,
    },
    {
      id: 'auto-reminder',
      title: 'Travel Reminder',
      description: 'Remind 15 min early for events with a location set.',
      enabled: true,
    },
  ];

  function _load() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (stored && stored.length) return stored;
    } catch { /* ignore */ }
    return DEFAULTS.map(a => ({ ...a }));
  }

  function _save(automations) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(automations));
  }

  function getAll() {
    return _load();
  }

  function toggle(id) {
    const automations = _load();
    const found = automations.find(a => a.id === id);
    if (found) {
      found.enabled = !found.enabled;
      _save(automations);
    }
    return found;
  }

  function render(containerEl) {
    const automations = getAll();
    containerEl.innerHTML = '';

    if (!automations.length) {
      containerEl.innerHTML = '<p class="empty-state">No automations configured.</p>';
      return;
    }

    automations.forEach(auto => {
      const card = document.createElement('div');
      card.className = 'automation-card';
      card.innerHTML = `
        <div class="auto-info">
          <div class="auto-title">${_esc(auto.title)}</div>
          <div class="auto-desc">${_esc(auto.description)}</div>
        </div>
        <label class="toggle" title="${auto.enabled ? 'Enabled' : 'Disabled'}">
          <input type="checkbox" data-id="${_esc(auto.id)}" ${auto.enabled ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>`;

      card.querySelector('input').addEventListener('change', function () {
        toggle(this.dataset.id);
      });

      containerEl.appendChild(card);
    });
  }

  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { getAll, toggle, render };
})();
