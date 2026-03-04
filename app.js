/* ══════════════════════════════════════
   MintSchedule — Main App
   ══════════════════════════════════════ */

/* ── Toast utility (global, used by all modules) ── */
const Toast = (() => {
  const container = document.getElementById('toast-container');

  function show(message, type = 'info') {
    const t = document.createElement('div');
    t.className   = `toast ${type}`;
    t.textContent = message;
    container.appendChild(t);

    setTimeout(() => {
      t.style.animation = 'fadeOut .3s ease forwards';
      setTimeout(() => t.remove(), 300);
    }, 3000);
  }

  return { show };
})();

/* ── Boot when auth confirms a logged-in user ── */
document.addEventListener('ms:ready', () => {
  try { Calendar.init(); }      catch(e) { console.error('[MintSchedule] Calendar init error:', e); }
  try { Automation.init(); }    catch(e) { console.error('[MintSchedule] Automation init error:', e); }
  try { Notifications.init(); } catch(e) { console.error('[MintSchedule] Notifications init error:', e); }

  /* Sidebar navigation */
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.dataset.view);

      /* Refresh relevant view */   
      if (btn.dataset.view === 'schedule')      Calendar.renderSchedule();
      if (btn.dataset.view === 'automation')    Automation.render();
      if (btn.dataset.view === 'notifications') Notifications.render();
    });
  });

  /* Topbar live date */
  updateTopbarDate();
  setInterval(updateTopbarDate, 60_000);

  /* Mobile sidebar toggle */
  const sidebar = document.getElementById('sidebar');
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  /* Close sidebar on backdrop click (mobile) */
  document.addEventListener('click', e => {
    if (window.innerWidth <= 768
        && sidebar.classList.contains('open')
        && !sidebar.contains(e.target)
        && e.target.id !== 'sidebar-toggle') {
      sidebar.classList.remove('open');
    }
  });

  console.log('%c🌿 MintSchedule loaded', 'color:#3ecf8e; font-weight:bold; font-size:1rem;');
});

function updateTopbarDate() {
  const el = document.getElementById('topbar-date');
  if (!el) return;
  const now    = new Date();
  const opts   = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  el.textContent = now.toLocaleDateString(undefined, opts);
}
