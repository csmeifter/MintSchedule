/* ══════════════════════════════════════
   MintSchedule — Automation Module
   Supports Google Home & Amazon Alexa
   (OAuth flow stubs + mock execution)
   ══════════════════════════════════════ */

const Automation = (() => {

  /* ── Storage ───────────────────────── */
  const aKey = () => `ms_automations_${Auth.currentUser()?.id}`;
  const cKey = () => `ms_connections_${Auth.currentUser()?.id}`;

  function getAutomations() { return JSON.parse(localStorage.getItem(aKey()) || '[]'); }
  function saveAutomations(a) { localStorage.setItem(aKey(), JSON.stringify(a)); }
  function getConnections() { return JSON.parse(localStorage.getItem(cKey()) || '{}'); }
  function saveConnections(c) { localStorage.setItem(cKey(), JSON.stringify(c)); }

  /* ── Platform Connectors ───────────── */

  /**
   * Google Smart Home — OAuth 2.0 flow.
   * In a real deployment, redirect the user to:
   *   https://accounts.google.com/o/oauth2/auth
   *     ?client_id=YOUR_CLIENT_ID
   *     &redirect_uri=YOUR_REDIRECT_URI
   *     &scope=https://www.googleapis.com/auth/homegraph
   *     &response_type=code
   * Exchange the returned code for tokens on your backend,
   * then call the Google Home Graph API to control devices.
   *
   * For this demo, we simulate a successful connection.
   */
  function connectGoogle() {
    return new Promise(resolve => {
      const status = document.getElementById('connect-status');
      status.textContent  = '⏳ Connecting to Google Home…';
      status.className    = 'connect-status success';
      status.classList.remove('hidden');

      setTimeout(() => {
        const connections = getConnections();
        connections.google = {
          connected: true,
          account: Auth.currentUser()?.email,
          token: 'mock_google_token_' + Date.now(),
          connectedAt: new Date().toISOString(),
        };
        saveConnections(connections);
        status.textContent = '✅ Google Home connected! Your devices are ready.';
        updateConnectButtons();
        Toast.show('Google Home connected!', 'success');
        resolve(true);
      }, 1500);
    });
  }

  /**
   * Amazon Alexa — Smart Home Skill API.
   * In a real deployment:
   *   1. Create a Smart Home Skill in the Alexa Developer Console.
   *   2. Set up Account Linking (OAuth 2.0) pointing to your auth server.
   *   3. Users enable the skill in the Alexa app; you receive an access token.
   *   4. Use the Alexa Smart Home API to send directives:
   *      POST https://api.amazonalexa.com/v3/events
   *      Authorization: Bearer <access_token>
   *
   * For this demo, we simulate a successful connection.
   */
  function connectAlexa() {
    return new Promise(resolve => {
      const status = document.getElementById('connect-status');
      status.textContent = '⏳ Connecting to Amazon Alexa…';
      status.className   = 'connect-status success';
      status.classList.remove('hidden');

      setTimeout(() => {
        const connections = getConnections();
        connections.alexa = {
          connected: true,
          account: Auth.currentUser()?.email,
          token: 'mock_alexa_token_' + Date.now(),
          connectedAt: new Date().toISOString(),
        };
        saveConnections(connections);
        status.textContent = '✅ Amazon Alexa connected! Your devices are ready.';
        updateConnectButtons();
        Toast.show('Amazon Alexa connected!', 'success');
        resolve(true);
      }, 1500);
    });
  }

  /**
   * Execute an automation action.
   *
   * Real integration notes:
   * — Google Home: call POST /homegraph.googleapis.com/v1/devices:executeRequest
   *     with the command (e.g. action.devices.commands.OnOff)
   * — Alexa: POST https://api.amazonalexa.com/v3/events
   *     with a Alexa.PowerController directive
   *
   * Here we simulate and log to console.
   */
  function executeAutomation(auto) {
    const connections = getConnections();
    const conn = connections[auto.platform];

    if (!conn?.connected) {
      Toast.show(`Connect ${auto.platform === 'google' ? 'Google Home' : 'Amazon Alexa'} first!`, 'error');
      return;
    }

    console.log(`[MintSchedule] Executing automation "${auto.name}"`, {
      platform: auto.platform,
      device:   auto.device,
      action:   auto.action,
      token:    conn.token,
    });

    Toast.show(`⚡ "${auto.device}" — ${formatAction(auto.action)}`, 'info');
    Notifications.add({
      id:    crypto.randomUUID(),
      title: `Automation Triggered: ${auto.name}`,
      body:  `${auto.device} → ${formatAction(auto.action)}`,
      time:  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  }

  function formatAction(a) {
    return { turn_on: 'Turned On', turn_off: 'Turned Off',
             set_brightness: 'Brightness set to 50%', run_routine: 'Routine started' }[a] || a;
  }

  /* ── CRUD ──────────────────────────── */
  function addAutomation(data) {
    const automations = getAutomations();
    data.id      = crypto.randomUUID();
    data.enabled = true;
    automations.push(data);
    saveAutomations(automations);
    return data;
  }

  function updateAutomation(id, updates) {
    const automations = getAutomations();
    const idx = automations.findIndex(a => a.id === id);
    if (idx === -1) return null;
    automations[idx] = { ...automations[idx], ...updates };
    saveAutomations(automations);
    return automations[idx];
  }

  function deleteAutomation(id) {
    saveAutomations(getAutomations().filter(a => a.id !== id));
  }

  /* ── Render ────────────────────────── */
  function render() {
    const list  = document.getElementById('automations-list');
    const empty = document.getElementById('automations-empty');
    if (!list) return;
    list.innerHTML = '';

    const automations = getAutomations();
    if (automations.length === 0) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    automations.forEach(auto => {
      const item = document.createElement('div');
      item.className = 'automation-item';

      const platformLabel = auto.platform === 'google' ? 'G' : 'A';
      const platformClass = `platform-${auto.platform}`;
      const triggerDesc   = auto.eventTrigger
        ? `Linked to event`
        : (auto.date ? `${auto.date} at ${auto.time}` : 'No trigger set');

      item.innerHTML = `
        <div class="auto-platform-badge ${platformClass}">${platformLabel}</div>
        <div class="auto-info">
          <div class="auto-name">${escHtml(auto.name)}</div>
          <div class="auto-details">
            ${escHtml(auto.device)} · ${formatAction(auto.action)} · ${triggerDesc}
          </div>
        </div>
        <label class="auto-toggle" title="Enable/Disable">
          <input type="checkbox" ${auto.enabled ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      `;

      /* Toggle enabled */
      item.querySelector('input[type="checkbox"]').addEventListener('change', e => {
        e.stopPropagation();
        updateAutomation(auto.id, { enabled: e.target.checked });
        Toast.show(e.target.checked ? `"${auto.name}" enabled` : `"${auto.name}" disabled`, 'info');
      });

      /* Click to edit */
      item.querySelector('.auto-info').addEventListener('click', () =>
        openModal(auto));

      list.appendChild(item);
    });
  }

  /* ── Modal ─────────────────────────── */
  function openModal(existing) {
    const modal  = document.getElementById('automation-modal');
    const delBtn = document.getElementById('auto-delete-btn');
    document.getElementById('automation-form').reset();
    populateEventOptions();

    if (existing) {
      document.getElementById('auto-modal-title').textContent = 'Edit Automation';
      document.getElementById('auto-id').value       = existing.id;
      document.getElementById('auto-name').value     = existing.name;
      document.getElementById('auto-platform').value = existing.platform;
      document.getElementById('auto-device').value   = existing.device;
      document.getElementById('auto-action').value   = existing.action;
      document.getElementById('auto-date').value     = existing.date || '';
      document.getElementById('auto-time').value     = existing.time || '';
      if (existing.eventTrigger) {
        document.getElementById('auto-event-trigger').value = existing.eventTrigger;
      }
      delBtn.style.display = '';
    } else {
      document.getElementById('auto-modal-title').textContent = 'New Automation';
      document.getElementById('auto-id').value = '';
      delBtn.style.display = 'none';
    }

    modal.classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('automation-modal').classList.add('hidden');
  }

  function populateEventOptions() {
    const sel    = document.getElementById('auto-event-trigger');
    if (!sel) return;
    const events = Calendar.getEvents();
    sel.innerHTML = '<option value="">— Select an event —</option>';
    events.sort((a, b) => a.date.localeCompare(b.date)).forEach(evt => {
      const opt = document.createElement('option');
      opt.value       = evt.id;
      opt.textContent = `${evt.date} ${evt.time} — ${evt.title}`;
      sel.appendChild(opt);
    });
  }

  function updateConnectButtons() {
    const connections = getConnections();
    const gBtn = document.getElementById('connect-google');
    const aBtn = document.getElementById('connect-alexa');
    if (connections.google?.connected) {
      gBtn.classList.add('connected');
      gBtn.innerHTML = '<span>✓</span> Google Home Connected';
    }
    if (connections.alexa?.connected) {
      aBtn.classList.add('connected');
      aBtn.innerHTML = '<span>✓</span> Alexa Connected';
    }
  }

  /* ── Scheduler ─────────────────────── */
  function startScheduler() {
    setInterval(() => {
      const now   = new Date();
      const nowDs = toDateStr(now);
      const nowTm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

      getAutomations()
        .filter(a => a.enabled)
        .forEach(auto => {
          let trigger = false;

          if (auto.eventTrigger) {
            const evts = Calendar.getEvents();
            const evt  = evts.find(e => e.id === auto.eventTrigger);
            if (evt && evt.date === nowDs && evt.time === nowTm) trigger = true;
          } else if (auto.date === nowDs && auto.time === nowTm) {
            trigger = true;
          }

          if (trigger) executeAutomation(auto);
        });
    }, 30000); // check every 30 s
  }

  /* ── Init ──────────────────────────── */
  return {
    init() {
      render();
      updateConnectButtons();
      startScheduler();

      document.getElementById('btn-add-automation').addEventListener('click', () => openModal());
      document.getElementById('connect-google').addEventListener('click', connectGoogle);
      document.getElementById('connect-alexa').addEventListener('click', connectAlexa);

      document.getElementById('auto-modal-close').addEventListener('click', closeModal);
      document.getElementById('auto-cancel-btn').addEventListener('click', closeModal);
      document.getElementById('auto-modal-backdrop').addEventListener('click', closeModal);

      document.getElementById('automation-form').addEventListener('submit', e => {
        e.preventDefault();
        const id  = document.getElementById('auto-id').value;
        const data = {
          name:         document.getElementById('auto-name').value.trim(),
          platform:     document.getElementById('auto-platform').value,
          device:       document.getElementById('auto-device').value.trim(),
          action:       document.getElementById('auto-action').value,
          date:         document.getElementById('auto-date').value,
          time:         document.getElementById('auto-time').value,
          eventTrigger: document.getElementById('auto-event-trigger').value,
        };

        if (id) {
          updateAutomation(id, data);
          Toast.show('Automation updated ✓', 'success');
        } else {
          addAutomation(data);
          Toast.show('Automation saved ✓', 'success');
        }

        closeModal();
        render();
      });

      document.getElementById('auto-delete-btn').addEventListener('click', () => {
        const id = document.getElementById('auto-id').value;
        if (id && confirm('Delete this automation?')) {
          deleteAutomation(id);
          closeModal();
          render();
          Toast.show('Automation deleted', 'info');
        }
      });
    },

    render,
    populateEventOptions,
  };
})();
