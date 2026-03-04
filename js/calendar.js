// calendar.js – calendar rendering and event storage

const Calendar = (() => {
  const EVENTS_KEY = 'mintschedule_events';
  let _year = new Date().getFullYear();
  let _month = new Date().getMonth(); // 0-indexed
  let _onDayClick = null;

  const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // ── Event storage ────────────────────────────────────────────────

  function getEvents() {
    try {
      return JSON.parse(localStorage.getItem(EVENTS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveEvents(events) {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }

  function addEvent(event) {
    const events = getEvents();
    // Note: ID uses timestamp + random to minimise collisions; not guaranteed unique under extreme concurrency.
    event.id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    events.push(event);
    saveEvents(events);
    return event;
  }

  function deleteEvent(id) {
    saveEvents(getEvents().filter(e => e.id !== id));
  }

  function getEventsForDate(dateStr) {
    return getEvents().filter(e => e.date === dateStr);
  }

  // ── Rendering ────────────────────────────────────────────────────

  function _toDateStr(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function render(gridEl, titleEl) {
    const today = new Date();
    const todayStr = _toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

    titleEl.textContent = `${MONTH_NAMES[_month]} ${_year}`;

    const firstDay = new Date(_year, _month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(_year, _month + 1, 0).getDate();
    const events = getEvents();

    // Build a quick lookup: dateStr -> count
    const eventCounts = {};
    events.forEach(e => {
      eventCounts[e.date] = (eventCounts[e.date] || 0) + 1;
    });

    gridEl.innerHTML = '';

    // Day-name header row
    DAY_NAMES.forEach(name => {
      const el = document.createElement('div');
      el.className = 'cal-day-name';
      el.textContent = name;
      gridEl.appendChild(el);
    });

    // Empty cells before the 1st
    for (let i = 0; i < firstDay; i++) {
      const el = document.createElement('div');
      el.className = 'cal-day empty';
      gridEl.appendChild(el);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = _toDateStr(_year, _month, day);
      const el = document.createElement('div');
      el.className = 'cal-day' + (dateStr === todayStr ? ' today' : '');
      el.dataset.date = dateStr;

      const numEl = document.createElement('span');
      numEl.className = 'day-number';
      numEl.textContent = day;
      el.appendChild(numEl);

      const count = eventCounts[dateStr] || 0;
      for (let d = 0; d < Math.min(count, 3); d++) {
        const dot = document.createElement('span');
        dot.className = 'event-dot';
        el.appendChild(dot);
      }

      el.addEventListener('click', () => {
        if (_onDayClick) _onDayClick(dateStr);
      });

      gridEl.appendChild(el);
    }
  }

  function prevMonth() {
    if (_month === 0) { _month = 11; _year--; }
    else { _month--; }
  }

  function nextMonth() {
    if (_month === 11) { _month = 0; _year++; }
    else { _month++; }
  }

  function onDayClick(fn) { _onDayClick = fn; }

  return { render, prevMonth, nextMonth, onDayClick, addEvent, deleteEvent, getEventsForDate, getEvents };
})();
