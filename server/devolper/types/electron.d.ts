import { OpenDialogOptions } from 'electron';

// Define your custom Electron API interface
interface CustomElectronAPI {
  parseUrl: (url: string) => Promise<string>;
}

// Extend the Shell interface with a new name to avoid conflicts
declare module 'electron' {
  interface ShellExtended {
    openExternal(url: string, options?: { activate?: boolean }): boolean | Promise<void>;
  }
}

// Extend the global Window object
declare global {
  interface Window {
    electronAPI: {
      [x: string]: any;
      openFile: (options: OpenDialogOptions) => Promise<string | null>;
    };
    myAPI: {
      loadPreferences: () => Promise<any>;
    };
  }
}

export {};