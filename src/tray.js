// tray.js
// Creates a system tray icon with a menu to control the tracker.
// Shows tracking status, allows pause/resume, and quit.

const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');
const { start, stop } = require('./tracker');

let tray = null;
let isTracking = true;

// ─── Create a simple colored icon ────────────────────────────────────────
// Green = tracking, Red = paused
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
