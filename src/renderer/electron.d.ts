import { OpenDialogOptions } from 'electron';

interface ElectronAPI {
  parseUrl: (url: string) => Promise<string>;
}

declare global {
  interface Window {
    Electron: {
      openFile: (options: OpenDialogOptions) => Promise<string | null>;
    };
    myAPI: {
      loadPreferences: () => Promise<any>;
    };
  }
}