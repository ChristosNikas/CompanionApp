// tracker.js
// Tracks active window, app focus time, and idle state.
// Exposes eventBuffer which sender.js reads from.

const { app }   = require('electron');
const { spawn } = require('child_process');
const path      = require('path');

// ─── Shared buffer — sender.js reads and drains this ─────────────────────
const eventBuffer = [];
let watherProcess = null;
// ─── Start & stop ─────────────────────────────────────────────────────────
function start() {
  const scriptPath = path.join(__dirname, 'watcher.py');
  watcherProcess = spawn('python3', [scriptPath], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  watcherProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        if (event.error) {
          console.warn('[tracker] watcher error:', event.error);
        } else {
          console.log('[tracker] captured:', event.app, `(${event.durationSecs}s)`);
          eventBuffer.push(event);
        }
      } catch (e) {
        console.warn('[tracker] bad JSON from watcher:', line);
      }
    }
  });
  watcherProcess.stderr.on('data', (data) => {
    const msg = data.toString();
    if (!msg.includes('AT-SPI') && !msg.includes('dbind')) {
      console.warn('[tracker] stderr:', msg);
    }
  });
  watcherProcess.on('close', (code) => {
    console.log(`[tracker] watcher exited with code ${code}`);
    watcherProcess = null;
  });
  console.log('[tracker] Started.');
}

function stop() {
  if (watcherProcess) {
    watcherProcess.kill();
    watcherProcess = null;
    console.log('[tracker] Stopped.');
  }
}

// ─── Hook into Electron app lifecycle ────────────────────────────────────
app.whenReady().then(start);
app.on('before-quit', stop);

module.exports = { eventBuffer, start, stop };
