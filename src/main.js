require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { start, stop, allEvents }         = require('./tracker');
const { flush }                          = require('./sender');
const { initTray }                       = require('./tray');
const { loadCategories, saveCategories } = require('./categories');

app.on('window-all-closed', (e) => e.preventDefault());

let mainWindow     = null;
let reportWindow   = null;
let settingsWindow = null;
let sessionSnapshot = [];

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 380, height: 680,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'handler.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

function createReportWindow() {
  reportWindow = new BrowserWindow({
    width: 800, height: 900,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'handler.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  reportWindow.loadFile(path.join(__dirname, 'report', 'report.html'));
  reportWindow.on('closed', () => {
    reportWindow = null;
    app.quit();
  });
}

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 700, height: 600,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'handler.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  settingsWindow.loadFile(path.join(__dirname, 'settings', 'settings.html'));
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

ipcMain.on('start-tracking', () => {
  console.log('[main] Start tracking.');
  start();
});

ipcMain.on('stop-tracking', () => {
  console.log('[main] Stop tracking.');
  stop();
  sessionSnapshot = [...allEvents];
});

ipcMain.on('show-report', () => {
  console.log('[main] Opening report window.');
  if (mainWindow) mainWindow.close();
  if (!reportWindow) createReportWindow();
  else reportWindow.focus();
  const { getTray } = require('./tray');
  const t = getTray();
  if (t) t.destroy();
});

ipcMain.on('show-settings', () => {
  console.log('[main] Opening settings window.');
  if (!settingsWindow) createSettingsWindow();
  else settingsWindow.focus();
});

ipcMain.handle('get-events',      ()        => sessionSnapshot);
ipcMain.handle('flush-events',    async ()  => { await flush(); return true; });
ipcMain.handle('get-categories',  ()        => loadCategories());
ipcMain.handle('save-categories', (_, cats) => saveCategories(cats));
ipcMain.on('quit-app',            ()        => app.quit());

app.whenReady().then(() => {
  console.log('[main] Companion App started.');
  createMainWindow();
  initTray();
  console.log('[main] Ready.');
});

app.on('before-quit', async () => {
  stop();
  await flush();
  console.log('[main] Done. Goodbye!');
});