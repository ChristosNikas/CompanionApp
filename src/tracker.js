// tracker.js
// Tracks active window, app focus time, and idle state.
// Exposes eventBuffer which sender.js reads from.

const { powerMonitor, app } = require('electron');
const activeWin = require('active-win'); // npm i active-win

// ─── Shared buffer — sender.js reads and drains this ─────────────────────
const eventBuffer = [];

// ─── Internal state ───────────────────────────────────────────────────────
let currentSession = null;
let isIdle = false;
const IDLE_THRESHOLD_SECS = 60;    // mark idle after 60s no input
const POLL_INTERVAL_MS   = 5_000;  // check active window every 5s

// ─── Close the current session and push it to the buffer ─────────────────
function closeSession(endTime) {
  if (!currentSession) return;

  const durationSecs = Math.round((endTime - currentSession.startedAt) / 1000);

  // Only log sessions longer than 2 seconds to avoid noise
  if (durationSecs > 2) {
    eventBuffer.push({
      app:          currentSession.app,
      windowTitle:  currentSession.title,
      timestamp:    currentSession.timestamp,
      durationSecs,
      isIdle:       currentSession.wasIdle,
    });
  }

  currentSession = null;
}

// ─── Main polling loop ────────────────────────────────────────────────────
async function tick() {
  try {
    const now     = new Date();
    const idleSecs = powerMonitor.getSystemIdleTime();
    const nowIdle  = idleSecs >= IDLE_THRESHOLD_SECS;

    // Idle state changed — close current session and start an idle one
    if (nowIdle !== isIdle) {
      closeSession(now);
      isIdle = nowIdle;
    }

    const win = await activeWin.getActiveWindow();
    const appName    = win?.owner?.name  || 'unknown';
    const winTitle   = win?.title        || '';

    // App switched — close previous session
    if (currentSession && currentSession.app !== appName) {
      closeSession(now);
    }

    // Start a new session if none is running
    if (!currentSession) {
      currentSession = {
        app:       appName,
        title:     winTitle,
        startedAt: now,
        timestamp: now.toISOString(),
        wasIdle:   isIdle,
      };
    } else {
      // Update title in case it changed (e.g. browser tab switch)
      currentSession.title = winTitle;
    }

  } catch (err) {
    console.warn('[tracker] tick error:', err.message);
  }
}

// ─── Start & stop ─────────────────────────────────────────────────────────
let pollTimer = null;

function start() {
  if (pollTimer) return;
  console.log('[tracker] Started.');
  pollTimer = setInterval(tick, POLL_INTERVAL_MS);
  tick(); // run immediately on start
}

function stop() {
  if (!pollTimer) return;
  clearInterval(pollTimer);
  pollTimer = null;
  closeSession(new Date()); // save the last open session
  console.log('[tracker] Stopped.');
}

// ─── Hook into Electron app lifecycle ────────────────────────────────────
app.whenReady().then(start);
app.on('before-quit', stop);

module.exports = { eventBuffer, start, stop };
