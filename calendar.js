/* ══════════════════════════════════════
   MintSchedule — Calendar Module
   ══════════════════════════════════════ */

const Calendar = (() => {

  /* ── Storage helpers ───────────────── */
  const key = () => `ms_events_${Auth.currentUser()?.id}`;

  function getEvents() {
    return JSON.parse(localStorage.getItem(key()) || '[]');
  }

  function saveEvents(events) {
    localStorage.setItem(key(), JSON.stringify(events));
  }

  function addEvent(evt) {
    const events = getEvents();
    evt.id = crypto.randomUUID();
    events.push(evt);
    saveEvents(events);
    return evt;
  }

  function updateEvent(id, updates) {
    const events = getEvents();
    const idx    = events.findIndex(e => e.id === id);
    if (idx === -1) return null;
    events[idx] = { ...events[idx], ...updates };
    saveEvents(events);
    return events[idx];
  }

  function deleteEvent(id) {
    saveEvents(getEvents().filter(e => e.id !== id));
  }

  function getEventsForDate(dateStr) {
    return getEvents().filter(e => e.date === dateStr);
  }

  /* ── State ─────────────────────────── */
  let viewDate    = new Date();
  let selectedDay = toDateStr(new Date());

  /* ── Render calendar ───────────────── */
  const DAYS    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS  = ['January','February','March','April','May','June',
                   'July','August','September','October','November','December'];

  function render() {
    const grid  = document.getElementById('calendar-grid');
    const label = document.getElementById('calendar-month-label');
    if (!grid) return;
    grid.innerHTML = '';

    label.textContent = `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`;

    /* Day headers */
    DAYS.forEach(d => {
      const h = document.createElement('div');
      h.className = 'cal-day-header';
      h.textContent = d;
      grid.appendChild(h);
    });

    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const lastDay  = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const todayStr = toDateStr(new Date());

    /* Leading blanks */
    for (let i = 0; i < firstDay.getDay(); i++) {
      const prev = new Date(firstDay);
      prev.setDate(prev.getDate() - (firstDay.getDay() - i));
      grid.appendChild(makeDayCell(prev, true, todayStr));
    }

    /* Current month days */
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
      grid.appendChild(makeDayCell(date, false, todayStr));
    }

    /* Trailing blanks */
    const remainder = 7 - ((firstDay.getDay() + lastDay.getDate()) % 7);
    if (remainder < 7) {
      for (let i = 1; i <= remainder; i++) {
        const next = new Date(lastDay);
        next.setDate(next.getDate() + i);
        grid.appendChild(makeDayCell(next, true, todayStr));
      }
    }
  }

  function makeDayCell(date, otherMonth, todayStr) {
    const ds   = toDateStr(date);
    const cell = document.createElement('div');
    cell.className = 'cal-day';
    if (otherMonth)  cell.classList.add('other-month');
    if (ds === todayStr)    cell.classList.add('today');
    if (ds === selectedDay) cell.classList.add('selected');

    const numEl = document.createElement('div');
    numEl.className   = 'cal-day-num';
    numEl.textContent = date.getDate();
    cell.appendChild(numEl);

    /* Event dots */
    getEventsForDate(ds).slice(0, 3).forEach(evt => {
      const dot = document.createElement('div');
      dot.className  = `cal-event-dot cat-${evt.category || 'other'}`;
      dot.textContent = evt.title;
      cell.appendChild(dot);
    });

    cell.addEventListener('click', () => {
      selectedDay = ds;
      document.querySelectorAll('.cal-day').forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');
      renderSchedule(ds);
      switchView('schedule');
    });

    return cell;
  }

  /* ── Render schedule ───────────────── */
  function renderSchedule(dateStr) {
    const list    = document.getElementById('schedule-list');
    const empty   = document.getElementById('schedule-empty');
    const label   = document.getElementById('schedule-date-label');
    if (!list) return;

    const events = getEventsForDate(dateStr).sort((a, b) => a.time.localeCompare(b.time));
    const d      = new Date(dateStr + 'T00:00');
    label.textContent = `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;

    list.innerHTML = '';
    if (events.length === 0) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    events.forEach(evt => {
      const item = document.createElement('div');
      item.className = 'schedule-item';

      const [h, m] = evt.time.split(':').map(Number);
      const ampm   = h < 12 ? 'AM' : 'PM';
      const hr12   = h % 12 || 12;

      item.innerHTML = `
        <div class="schedule-time-block">
          <div class="schedule-time">${hr12}:${String(m).padStart(2,'0')}</div>
          <div class="schedule-ampm">${ampm}</div>
        </div>
        <div class="schedule-dot cat-${evt.category || 'other'}"></div>
        <div class="schedule-info">
          <div class="schedule-item-title">${escHtml(evt.title)}</div>
          ${evt.notes ? `<div class="schedule-item-notes">${escHtml(evt.notes)}</div>` : ''}
        </div>
        <div class="schedule-category cat-${evt.category || 'other'}">${capitalize(evt.category || 'other')}</div>
      `;
      item.addEventListener('click', () => document.dispatchEvent(
        new CustomEvent('ms:edit-event', { detail: evt })));
      list.appendChild(item);
    });
  }

  /* ── Event form modal ──────────────── */
  function openModal(prefillDate, existingEvent) {
    const modal = document.getElementById('event-modal');
    const title = document.getElementById('event-modal-title');
    const delBtn = document.getElementById('event-delete-btn');
    document.getElementById('event-form').reset();
    document.getElementById('reminder-options').classList.add('hidden');

    if (existingEvent) {
      title.textContent = 'Edit Event';
      document.getElementById('event-id').value       = existingEvent.id;
      document.getElementById('event-title').value    = existingEvent.title;
      document.getElementById('event-date').value     = existingEvent.date;
      document.getElementById('event-time').value     = existingEvent.time;
      document.getElementById('event-category').value = existingEvent.category || 'personal';
      document.getElementById('event-notes').value    = existingEvent.notes || '';
      if (existingEvent.reminder) {
        document.getElementById('event-reminder').checked = true;
        document.getElementById('reminder-options').classList.remove('hidden');
        document.getElementById('reminder-offset').value = existingEvent.reminderOffset ?? 15;
      }
      delBtn.style.display = '';
    } else {
      title.textContent = 'New Event';
      document.getElementById('event-date').value = prefillDate || toDateStr(new Date());
      delBtn.style.display = 'none';
    }

    modal.classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('event-modal').classList.add('hidden');
  }

  /* ── Public API ────────────────────── */
  return {
    init() {
      render();
      renderSchedule(toDateStr(new Date()));

      /* Nav */
      document.getElementById('cal-prev').addEventListener('click', () => {
        viewDate.setMonth(viewDate.getMonth() - 1);
        render();
      });
      document.getElementById('cal-next').addEventListener('click', () => {
        viewDate.setMonth(viewDate.getMonth() + 1);
        render();
      });
      document.getElementById('cal-today').addEventListener('click', () => {
        viewDate = new Date();
        selectedDay = toDateStr(new Date());
        render();
        renderSchedule(selectedDay);
      });

      /* New event button */
      document.getElementById('btn-add-event').addEventListener('click',
        () => openModal(selectedDay));

      /* Close modal */
      document.getElementById('event-modal-close').addEventListener('click', closeModal);
      document.getElementById('event-cancel-btn').addEventListener('click', closeModal);
      document.getElementById('event-modal-backdrop').addEventListener('click', closeModal);

      /* Reminder toggle */
      document.getElementById('event-reminder').addEventListener('change', e => {
        document.getElementById('reminder-options').classList.toggle('hidden', !e.target.checked);
      });

      /* Save event */
      document.getElementById('event-form').addEventListener('submit', e => {
        e.preventDefault();
        const id = document.getElementById('event-id').value;
        const data = {
          title:          document.getElementById('event-title').value.trim(),
          date:           document.getElementById('event-date').value,
          time:           document.getElementById('event-time').value,
          category:       document.getElementById('event-category').value,
          notes:          document.getElementById('event-notes').value.trim(),
          reminder:       document.getElementById('event-reminder').checked,
          reminderOffset: parseInt(document.getElementById('reminder-offset').value),
        };

        if (id) {
          updateEvent(id, data);
          Toast.show('Event updated ✓', 'success');
        } else {
          const evt = addEvent(data);
          if (evt.reminder) Notifications.schedule(evt);
          Toast.show('Event saved ✓', 'success');
        }

        closeModal();
        render();
        renderSchedule(data.date);
        Automation.populateEventOptions();
      });

      /* Delete */
      document.getElementById('event-delete-btn').addEventListener('click', () => {
        const id = document.getElementById('event-id').value;
        if (id && confirm('Delete this event?')) {
          deleteEvent(id);
          closeModal();
          render();
          renderSchedule(selectedDay);
          Toast.show('Event deleted', 'info');
        }
      });

      /* Edit event from schedule */
      document.addEventListener('ms:edit-event', e => openModal(null, e.detail));
    },

    getEvents,
    getEventsForDate,
    render,
    renderSchedule: () => renderSchedule(selectedDay),
    selectedDay: () => selectedDay,
  };
})();

/* ── Helpers ─────────────────────────── */
function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`view-${name}`).classList.add('active');
  document.querySelector(`[data-view="${name}"]`)?.classList.add('active');
}
