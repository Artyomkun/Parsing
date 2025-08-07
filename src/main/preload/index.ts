import { contextBridge, ipcRenderer } from 'electron';

// Типы для API
type FileDialogOptions = {
  title?: string;
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
};

type ParseOptions = {
  selector?: string;
  path?: string;
  format?: string;
  // Дополнительные опции по мере необходимости
};

type ParseSource = string | File | Blob | ArrayBuffer;

contextBridge.exposeInMainWorld('electronAPI', {
  // Системная информация
  platform: process.platform,
  appVersion: process.env.npm_package_version || '1.0.0',
  
  // Уведомления и диалоги
  showMessage: (message: string) => ipcRenderer.send('show-message', message),
  showError: (title: string, content: string) => ipcRenderer.send('show-error', { title, content }),
  
  // Работа с файловой системой
  openFileDialog: (options?: FileDialogOptions) => 
    ipcRenderer.invoke('dialog:openFile', options),  // поправлено: добавлено invoke
  openDirectoryDialog: (options?: FileDialogOptions) => 
    ipcRenderer.invoke('dialog:openDirectory', options),
  saveFileDialog: (options?: FileDialogOptions) => 
    ipcRenderer.invoke('dialog:saveFile', options),
  readFile: (filePath: string) => 
    ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath: string, data: string) => 
    ipcRenderer.invoke('fs:writeFile', filePath, data),
  
  // Универсальный метод парсинга
  parseContent: (
    type: string, 
    source: ParseSource, 
    options?: ParseOptions
  ) => ipcRenderer.invoke('parse:content', { type, source, options }),
  
  // Специализированные методы для удобства
  parseHTML: (source: ParseSource, selector: string) => 
    ipcRenderer.invoke('parse:content', { 
      type: 'html', 
      source, 
      options: { selector } 
    }),
  parseDynamicHTML: (url: string, selector: string) => 
    ipcRenderer.invoke('parse:content', { 
      type: 'dynamic-html', 
      source: url, 
      options: { selector } 
    }),
  parseNetworkResource: (url: string, type: string, options?: ParseOptions) => 
    ipcRenderer.invoke('parse:content', { 
      type, 
      source: url, 
      options: { ...(options || {}), sourceType: 'network' } // безопасное распространение options
    }),
  parseLocalFile: (filePath: string, type: string, options?: ParseOptions) => 
    ipcRenderer.invoke('parse:content', { 
      type, 
      source: filePath, 
      options: { ...(options || {}), sourceType: 'file' } // безопасное распространение options
    }),
  
  // Управление приложением
  restartApp: () => ipcRenderer.send('app:restart'),
  openDevTools: () => ipcRenderer.send('app:openDevTools'),
  
  // Логирование
  log: (level: 'info' | 'warn' | 'error', message: string) => 
    ipcRenderer.send('log', { level, message })
});

// Расширяем интерфейс Window для TypeScript
declare global {
  interface Window {
    electronAPI: {
      platform: string;
      appVersion: string;
      showMessage: (message: string) => void;
      showError: (title: string, content: string) => void;
      openFileDialog: (options?: FileDialogOptions) => Promise<string | null>;
      openDirectoryDialog: (options?: FileDialogOptions) => Promise<string | null>;
      saveFileDialog: (options?: FileDialogOptions) => Promise<string | null>;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, data: string) => Promise<void>;
      parseContent: (
        type: string, 
        source: ParseSource, 
        options?: ParseOptions
      ) => Promise<any>;
      parseHTML: (source: ParseSource, selector: string) => Promise<any>;
      parseDynamicHTML: (url: string, selector: string) => Promise<any>;
      parseNetworkResource: (url: string, type: string, options?: ParseOptions) => Promise<any>;
      parseLocalFile: (filePath: string, type: string, options?: ParseOptions) => Promise<any>;
      restartApp: () => void;
      openDevTools: () => void;
      log: (level: 'info' | 'warn' | 'error', message: string) => void;
    };
  }
}
