import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  parseHTML: (url: string, selector: string) => 
    ipcRenderer.invoke('parse:html', url, selector),
  
  parseDynamic: (url: string, selector: string) => 
    ipcRenderer.invoke('parse:dynamic', url, selector)
});


