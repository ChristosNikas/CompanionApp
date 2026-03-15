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

  const appMap      = {};
  const categoryMap = {};
  let totalSecs     = 0;

  for (const e of events) {
    const d     = e.durationSecs || 0;
    totalSecs  += d;
    const cat   = e.category      || 'Uncategorized';
    const color = e.categoryColor || '#4a4a5a';

    if (!categoryMap[cat]) categoryMap[cat] = { secs: 0, color };
    categoryMap[cat].secs += d;

    if (!appMap[e.app]) appMap[e.app] = { secs: 0, category: cat, color };
    appMap[e.app].secs += d;
  }

  const sortedApps = Object.entries(appMap).sort((a, b) => b[1].secs - a[1].secs);
  const sortedCats = Object.entries(categoryMap).sort((a, b) => b[1].secs - a[1].secs);

  document.getElementById('total-time').textContent   = formatTime(totalSecs);
  document.getElementById('session-date').textContent =
    events[0]?.timestamp ? `// ${events[0].timestamp}` : '// session';

  document.getElementById('category-bars').innerHTML = sortedCats.map(([cat, data]) => {
    const pct = Math.round((data.secs / totalSecs) * 100);
    return `
      <div class="cat-breakdown-row">
        <div class="cat-breakdown-label">
          <span class="cat-dot" style="background:${data.color}"></span>
          <span class="cat-name">${cat}</span>
          <span class="cat-time">${formatTime(data.secs)}</span>
        </div>
        <div class="cat-bar-wrap">
          <div class="cat-bar-fill" style="width:${pct}%; background:${data.color}"></div>
        </div>
        <span class="cat-pct">${pct}%</span>
      </div>`;
  }).join('');

  const [topApp, topData] = sortedApps[0];
  const topPct = Math.round((topData.secs / totalSecs) * 100);
  document.getElementById('top-app-name').textContent = topApp;
  document.getElementById('top-app-time').textContent = `${formatTime(topData.secs)} — ${topPct}% of session`;
  const badge = document.getElementById('top-app-badge');
  badge.textContent       = topData.category;
  badge.style.borderColor = topData.color;
  badge.style.color       = topData.color;

  document.getElementById('apps-list').innerHTML = sortedApps.map(([app, data]) => {
    const pct  = Math.round((data.secs / totalSecs) * 100);
    const barW = Math.round((data.secs / sortedApps[0][1].secs) * 100);
    return `
      <div class="app-row">
        <div class="app-dot" style="background:${data.color}"></div>
        <div class="app-name">${app}</div>
        <div class="app-bar-wrap">
          <div class="app-bar-fill" style="width:${barW}%; background:${data.color}"></div>
        </div>
        <div class="app-pct">${pct}%</div>
        <div class="app-time">${formatTime(data.secs)}</div>
      </div>`;
  }).join('');

  document.getElementById('timeline').innerHTML = events.map(e => `
    <div class="timeline-item">
      <div class="timeline-dot" style="background:${e.categoryColor || '#4a4a5a'}"></div>
      <div class="timeline-content">
        <div class="timeline-app">${e.app}</div>
        <div class="timeline-title">${e.windowTitle || '—'}</div>
      </div>
      <div class="timeline-meta">
        <div class="timeline-cat" style="color:${e.categoryColor || '#4a4a5a'}">${e.category || 'Uncategorized'}</div>
        <div class="timeline-time">${e.duration || formatTime(e.durationSecs)}</div>
        <div class="timeline-ts">${e.timestamp || ''}</div>
      </div>
    </div>`).join('');
}

function closeReport() {
  if (window.electronAPI?.quit) window.electronAPI.quit();
  else window.close();
}

window.addEventListener('DOMContentLoaded', async () => {
  if (window.electronAPI?.getEvents) {
    const events = await window.electronAPI.getEvents();
    render(events);
  }
});