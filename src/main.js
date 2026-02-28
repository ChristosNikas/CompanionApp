// main.js
// Electron entry point.
// Wires together tracker.js, sender.js, tray.js, handler.js, index.html and report.html

require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { start, stop, eventBuffer } = require('./tracker');
const { flush }                     = require('./sender');
const { initTray }                  = require('./tray');

// ─── Keep app running when all windows are closed (lives in tray) ─────────
app.on('window-all-closed', (e) => {
  e.preventDefault();
});

// ─── Main window (index.html — big start/stop button) ────────────────────
let mainWindow = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 680,
    resizable: false,
    alwaysOnTop: true,        // floating window
    skipTaskbar: true,        // don't show in taskbar
    webPreferences: {
      preload: path.join(__dirname, 'handler.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });


  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── Report window (report.html — session summary) ───────────────────────
let reportWindow = null;

function createReportWindow() {
  reportWindow = new BrowserWindow({
    width: 420,
    height: 560,
    resizable: false,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'handler.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  reportWindow.loadFile(path.join(__dirname, 'report.html'));

  reportWindow.on('closed', () => {
    reportWindow = null;
  });
}

// ─── IPC listeners — respond to signals from handler.js ──────────────────

// User clicked START in index.html
ipcMain.on('start-tracking', () => {
  console.log('[main] Start tracking.');
  start();
});

// User clicked STOP in index.html
ipcMain.on('stop-tracking', () => {
  console.log('[main] Stop tracking.');
  stop();
});

// Open the report window
ipcMain.on('show-report', () => {
  console.log('[main] Opening report window.');
  if (!reportWindow) createReportWindow();
  else reportWindow.focus();
});

// report.html asks for the events to display
ipcMain.handle('get-events', () => {
  return [...eventBuffer];
});

// report.html triggers a flush to the web app
ipcMain.handle('flush-events', async () => {
  await flush();
  return true;
});

// ─── App ready ───────────────────────────────────────────────────────────
app.whenReady().then(() => {
  console.log('[main] Companion App started.');
  createMainWindow();
  initTray();
  console.log('[main] Ready.');
});

// ─── Clean shutdown ───────────────────────────────────────────────────────
app.on('before-quit', async () => {
  console.log('[main] Shutting down...');
  stop();
  await flush();
  console.log('[main] Done. Goodbye!');
});