import { FullElectronAPI } from './electron-api';

declare global {
  interface Window {
    electronAPI: FullElectronAPI;
  }
}