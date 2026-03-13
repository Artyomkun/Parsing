import { contextBridge, ipcRenderer } from 'electron';

// Types for file dialog options
type FileDialogOptions = {
  title?: string;
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
};

// Types for parse options
type ParseOptions = {
  selector?: string;
  path?: string;
  format?: string;
};

// Types for parse source
type ParseSource = string | File | Blob | ArrayBuffer;

// Electron API Object
const electronAPI = {
  platform: process.platform,
  appVersion: process.versions.electron, // Added app version for better context
  
  // Message handling functions
  showMessage: (message: string, type: 'info' | 'warning' | 'error' = 'info') =>
    ipcRenderer.send('show-message', { message, type }),

  showError: (title: string, content: string) =>
    ipcRenderer.send('show-error', { title, content }),

  // File dialog functions
  openFileDialog: (options?: FileDialogOptions) =>
    ipcRenderer.invoke('dialog:openFile', options),

  openDirectoryDialog: (options?: FileDialogOptions) =>
    ipcRenderer.invoke('dialog:openDirectory', options),

  saveFileDialog: (options?: FileDialogOptions) =>
    ipcRenderer.invoke('dialog:saveFile', options),

  // File system operations
  readFile: (filePath: string) =>
    ipcRenderer.invoke('fs:readFile', filePath),

  writeFile: (filePath: string, data: string) =>
    ipcRenderer.invoke('fs:writeFile', filePath, data),

  // Content parsing functions
  parseContent: (type: string, source: ParseSource, options?: ParseOptions) =>
    ipcRenderer.invoke('parse:content', { type, source, options }),

  parseHTML: (source: ParseSource, selector: string) =>
    ipcRenderer.invoke('parse:content', { type: 'html', source, options: { selector } }),

  parseDynamicHTML: (url: string, selector: string) =>
    ipcRenderer.invoke('parse:content', { type: 'dynamic-html', source: url, options: { selector } }),

  parseNetworkResource: (url: string, type: string, options?: ParseOptions) =>
    ipcRenderer.invoke('parse:content', { type, source: url, options: { ...(options || {}), sourceType: 'network' } }),

  parseLocalFile: (filePath: string, type: string, options?: ParseOptions) =>
    ipcRenderer.invoke('parse:content', { type, source: filePath, options: { ...(options || {}), sourceType: 'file' } }),

  // Application control functions
  restartApp: () => ipcRenderer.send('app:restart'),
  openDevTools: () => ipcRenderer.send('app:openDevTools'),

  // Logging functions
  log: (level: 'info' | 'warn' | 'error', message: string) =>
    ipcRenderer.send('log', { level, message }),
};

// Expose API once to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Global interface for the exposed API
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}