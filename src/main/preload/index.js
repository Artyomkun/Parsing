import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  showMessage: (message) => ipcRenderer.send('show-message', message),
  platform: process.platform,
  
  // Добавьте другие методы по мере необходимости
  openFile: () => ipcRenderer.invoke('dialog:openFile')
});