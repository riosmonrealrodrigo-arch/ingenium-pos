const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  printTicket: (options) => ipcRenderer.send('print-ticket', options),
});
