// Tracks active window,time


const { app }   = require('electron');
const { spawn } = require('child_process');
const path      = require('path');

const eventBuffer = [];
const allEvents = []; 
let watcherProcess = null;
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
        function getCategory(app, windowTitle) {
          const unproductiveApps = [
            'discord', 'spotify', 'steam',
          ];

          const unproductiveTitles = [
            'youtube', 'netflix', 'reddit',
            'twitter', 'instagram', 'tiktok',
            'facebook', 'twitch', 'x.com',
          ];

          // Check app name
          if (unproductiveApps.some(u => app.toLowerCase().includes(u))) {
            return 'unproductive';
          }

          // Check window title (catches browser tabs)
          if (windowTitle && unproductiveTitles.some(u => windowTitle.toLowerCase().includes(u))) {
            return 'unproductive';
          }

          return 'productive';
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
