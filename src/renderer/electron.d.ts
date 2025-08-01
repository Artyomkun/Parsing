interface ElectronAPI {
  parseUrl: (url: string) => Promise<string>;
}

interface Window {
  Electron: ElectronAPI;
}

declare global {
  interface Window {
    Electron: {
      openFile: (options: Electron.OpenDialogOptions) => Promise<string>;
    };
  }
}

const mainWindow = new BrowserWindow({
  webPreferences: {
    preload: path.join(app.getAppPath(), 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    enableRemoteModule: false // модуль remote отключён
  }
});

contextBridge.exposeInMainWorld('Electron', {
  openFile: (options) => ipcRenderer.invoke('open-file', options)
});

contextBridge.exposeInMainWorld('myAPI', {
  loadPreferences: () => ipcRenderer.invoke('load-prefs')
});

export default App;