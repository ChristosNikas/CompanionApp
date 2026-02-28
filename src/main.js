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
    app.quit(); // close the whole app when report is closed    !!!!!!!!!!!!!!!!!!!(after done remove this)
  });
}

// ─── IPC listeners — respond to signals from handler.js ──────────────────

// User clicked START in index.html
ipcMain.on('start-tracking', () => {
  console.log('[main] Start tracking.');
  start();
});
 sessionSnapshot = [...eventBuffer];
// User clicked STOP in index.html
ipcMain.on('stop-tracking', () => {
  console.log('[main] Stop tracking.');
  stop();
 
});


/*
ipcMain.handle('get-events', () => {
  let sessionSnapshot = [...eventBuffer];
  return sessionSnapshot;
  
});
*/
// report.html triggers a flush to the web app
const fs = require('fs');

ipcMain.handle('flush-events', async () => {
  // Save to file for testing
  fs.writeFileSync(
    path.join(__dirname, '../session.json'),
    JSON.stringify(sessionSnapshot, null, 2)
  );
  await flush();
  app.quit();
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