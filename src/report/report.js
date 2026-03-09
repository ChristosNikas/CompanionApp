// report.js
// Reads real session data and renders the report UI.

function formatTime(secs) {
  if (!secs || secs < 1) return '0s';
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
}

function render(events) {
  if (!events || events.length === 0) {
    document.getElementById('session-date').textContent = '// no data recorded';
    return;
  }

  // ── Aggregate ──
  const appMap = {};
  let totalSecs = 0, prodSecs = 0, unprodSecs = 0;

  for (const e of events) {
    const d = e.durationSecs || 0;
    totalSecs  += d;
    if (e.category === 'unproductive') unprodSecs += d;
    else prodSecs += d;

    if (!appMap[e.app]) appMap[e.app] = { secs: 0, category: e.category };
    appMap[e.app].secs += d;
  }

  const sorted    = Object.entries(appMap).sort((a, b) => b[1].secs - a[1].secs);
  const prodPct   = totalSecs ? Math.round((prodSecs   / totalSecs) * 100) : 0;
  const unprodPct = 100 - prodPct;

  // ── Header ──
  document.getElementById('total-time').textContent    = formatTime(totalSecs);
  document.getElementById('session-date').textContent  =
    events[0]?.timestamp ? `// ${events[0].timestamp}` : '// session';

    // ── Focus Ratio ──
    const focusRatio = totalSecs > 0
        ? Math.round((prodSecs / totalSecs) * 1000) / 10
        : 0;
    document.getElementById('focus-ratio').textContent = focusRatio + '%';

  // ── Productive split ──
  document.getElementById('split-bar').style.width     = prodPct + '%';
  document.getElementById('prod-pct').textContent      = prodPct + '%';
  document.getElementById('unprod-pct').textContent    = unprodPct + '%';
  document.getElementById('prod-time').textContent     = `productive — ${formatTime(prodSecs)}`;
  document.getElementById('unprod-time').textContent   = `unproductive — ${formatTime(unprodSecs)}`;

  // ── Most used app ──
  const [topApp, topData] = sorted[0];
  const topPct = Math.round((topData.secs / totalSecs) * 100);
  document.getElementById('top-app-name').textContent  = topApp;
  document.getElementById('top-app-time').textContent  = `${formatTime(topData.secs)} — ${topPct}% of session`;
  const badge = document.getElementById('top-app-badge');
  badge.textContent  = topData.category;
  badge.className    = `top-app-badge ${topData.category}`;

  // ── Apps list ──
  const maxSecs = sorted[0][1].secs;
  document.getElementById('apps-list').innerHTML = sorted.map(([app, data]) => {
    const pct  = Math.round((data.secs / totalSecs) * 100);
    const barW = Math.round((data.secs / maxSecs) * 100);
    return `
      <div class="app-row">
        <div class="app-dot ${data.category}"></div>
        <div class="app-name">${app}</div>
        <div class="app-bar-wrap">
          <div class="app-bar-fill" style="width:${barW}%"></div>
        </div>
        <div class="app-pct">${pct}%</div>
        <div class="app-time">${formatTime(data.secs)}</div>
      </div>`;
  }).join('');

  // ── Timeline ──
  document.getElementById('timeline').innerHTML = events.map(e => `
    <div class="timeline-item">
      <div class="timeline-dot ${e.category || 'productive'}"></div>
      <div class="timeline-content">
        <div class="timeline-app">${e.app}</div>
        <div class="timeline-title">${e.windowTitle || '—'}</div>
      </div>
      <div class="timeline-meta">
        <div class="timeline-time">${e.duration || formatTime(e.durationSecs)}</div>
        <div class="timeline-ts">${e.timestamp || ''}</div>
      </div>
    </div>`).join('');
}

// ── Actions ──
function closeReport() {
  if (window.electronAPI?.quit) window.electronAPI.quit();
  else window.close();
}

async function sendData() {
  const btn = document.getElementById('send-btn');
  btn.textContent = 'Sending...';
  btn.disabled = true;
  if (window.electronAPI?.flush) {
    try {
      await window.electronAPI.flush();
      btn.textContent = '✓ Sent!';
    } catch (e) {
      btn.textContent = 'Failed';
      btn.disabled = false;
    }
  } else {
    setTimeout(() => { btn.textContent = '✓ Sent!'; }, 800);
  }
}

// ── Load real data from Electron or session.json ──
window.addEventListener('DOMContentLoaded', async () => {
  if (window.electronAPI?.getEvents) {
    // Running inside Electron — get real session data
    const events = await window.electronAPI.getEvents();
    render(events);
  } else {
    // Fallback — try to load session.json directly
    try {
      const res    = await fetch('../session.json');
      const events = await res.json();
      render(events);
    } catch (e) {
      document.getElementById('session-date').textContent = '// could not load session.json';
    }
  }
});