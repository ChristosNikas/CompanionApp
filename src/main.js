// main.js
require('dotenv').config();
const { app, BrowserWindow } = require('electron');
const { initTray }           = require('./tray');
const { flush }              = require('./sender');

app.setAppUserModelId('com.companionapp');

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.whenReady().then(() => {
  console.log('[main] Companion App started.');
  initTray();
  flush();
  console.log('[main] Tracker and sender are running.');
});

app.on('before-quit', async () => {
  console.log('[main] Shutting down — flushing remaining events...');
  await flush();
  console.log('[main] Done. Goodbye!');
});