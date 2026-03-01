// Shows tracking status, allows pause/resume, and quit.

const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');
const { start, stop } = require('./tracker');

let tray = null;
let isTracking = true;

// Create a simple colored icon 
function createIcon(tracking) {
  const color = tracking ? '#4fffb0' : '#ff6b6b';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <circle cx="8" cy="8" r="7" fill="${color}"/>
    </svg>
  `;
  return nativeImage.createFromDataURL(
    `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  );
}

//Build the tray context menu 
function buildMenu() {
  return Menu.buildFromTemplate([
    {
      label: isTracking ? '🟢 Tracking active' : '🔴 Tracking paused',
      enabled: false, // just a status label
    },
    { type: 'separator' },
    {
      label: isTracking ? 'Pause tracking' : 'Resume tracking',
      click: () => {
        if (isTracking) {
          stop();
          isTracking = false;
          console.log('[tray] Tracking paused.');
        } else {
          start();
          isTracking = true;
          console.log('[tray] Tracking resumed.');
        }
        // Refresh the tray icon and menu
        tray.setImage(createIcon(isTracking));
        tray.setContextMenu(buildMenu());
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();

      },
    },
  ]);
}
// Initialize the tray 
function initTray() {
  tray = new Tray(createIcon(true));
  tray.setToolTip('Companion App — Tracking');
  tray.setContextMenu(buildMenu());

  // Left click also opens the menu
  tray.on('click', () => {
    tray.popUpContextMenu();
  });

  console.log('[tray] System tray initialized.');
}

module.exports = { initTray };
