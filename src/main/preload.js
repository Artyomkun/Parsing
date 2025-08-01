const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  saveResult: (data, format) => ipcRenderer.invoke('save-result', {data, format}),
  onMenuEvent: (callback) => {
    ipcRenderer.on('import-csv', () => callback('import-csv'));
    ipcRenderer.on('parse-web', () => callback('parse-web'));
  }
});