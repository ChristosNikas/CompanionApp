// Tracks active window,time


const { app }   = require('electron');
const { spawn } = require('child_process');
const path      = require('path');

const eventBuffer = [];
const allEvents = [];
let watcherProcess = null;

// ─── Category classification ──────────────────────────────────────────────
const PRODUCTIVE_APPS = [
  'code', 'vscode', 'notion', 'anki', 'zotero',
  'winword', 'soffice', 'libreoffice', 'excel', 'gnumeric',
];
const NEUTRAL_APPS = [
  'spotify', 'slack', 'thunderbird', 'outlook', 'mail', 'teams',
];
const DISTRACTING_APPS = [
  'discord', 'steam',
];
const PRODUCTIVE_TITLES = [
  'github', 'stackoverflow', 'docs.', 'mdn', 'wikipedia',
  'arxiv', 'scholar', 'overleaf',
];
const NEUTRAL_TITLES = [
  'gmail', 'outlook', 'email',
];
const DISTRACTING_TITLES = [
  'youtube', 'netflix', 'reddit', 'twitter', 'instagram',
  'tiktok', 'facebook', 'twitch', 'x.com', 'gaming',
];

function getCategory(appName, windowTitle) {
  const lApp   = appName.toLowerCase();
  const lTitle = (windowTitle || '').toLowerCase();

  if (PRODUCTIVE_APPS.some(u => lApp.includes(u)))   return 'productive';
  if (NEUTRAL_APPS.some(u => lApp.includes(u)))       return 'neutral';
  if (DISTRACTING_APPS.some(u => lApp.includes(u)))   return 'distracting';

  if (DISTRACTING_TITLES.some(u => lTitle.includes(u))) return 'distracting';
  if (NEUTRAL_TITLES.some(u => lTitle.includes(u)))     return 'neutral';
  if (PRODUCTIVE_TITLES.some(u => lTitle.includes(u)))  return 'productive';

  return 'productive';
}

//Start & stop
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
          const ignored = ['gnome-shell', 'gjs'];
          if (ignored.some(i => event.app.toLowerCase().includes(i))) continue;
          event.category = getCategory(event.app, event.windowTitle);
          eventBuffer.push(event);
          allEvents.push(event);
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

//Hook into Electron app lifecycle 

module.exports = { eventBuffer,allEvents, start, stop };
