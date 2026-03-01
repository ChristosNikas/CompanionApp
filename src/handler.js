// Creates a  bridge (electronAPI) between the HTML buttons
// and the Node.js backend (tracker.js and sender.js).
//
// WHY: Electron's security rules prevent HTML from calling Node.js directly.
// This file is the only safe way to connect them.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

  // Called when user clicks START button in index.html
  startTracking: () => {
    ipcRenderer.send('start-tracking');
  },

  // Called when user clicks STOP button in index.html
  stopTracking: () => {
    ipcRenderer.send('stop-tracking');
  },

  // Called after stop — opens the report window
  showReport: () => {
    ipcRenderer.send('show-report');
  },

  // Called by report.html — gets the collected events to display
  getEvents: () => {
    return ipcRenderer.invoke('get-events');
  },

  // Called by report.html — flushes events to the web app
  flush: () => {
    return ipcRenderer.invoke('flush-events');
  },

});