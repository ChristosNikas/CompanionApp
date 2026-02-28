const { app, BrowserWindow } = require('electron');

app.whenReady().then(() => {
  console.log('App is running!');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});