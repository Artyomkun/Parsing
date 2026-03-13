import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config(); // загружаем .env

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 39143;

console.log('[MAIN] Starting Electron process...');
console.log('[MAIN] __dirname:', __dirname);
console.log('[MAIN] process.cwd():', process.cwd());
console.log('[MAIN] isDev:', isDev, 'PORT:', PORT);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, isDev ? 'preload.ts' : 'preload.js'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  const indexPath = isDev
    ? `http://localhost:${PORT}`
    : mainWindow.loadFile(path.join(__dirname, 'my-dynamic-site/index.html'));

  mainWindow.loadURL(indexPath).catch(err => console.error('[MAIN] Failed to load:', err));

  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });

  mainWindow.on('closed', () => (mainWindow = null));

  return mainWindow;
}

function safeOpenExternal(url: string) {
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:', 'mailto:'].includes(parsedUrl.protocol)) {
      console.warn('Blocked unsafe protocol:', parsedUrl.protocol);
      return;
    }
    const result = shell.openExternal(url);
    if (result && typeof result === 'object' && 'then' in result) {
      (result as Promise<void>).catch(err => console.error('Failed to open URL:', err));
    } else if (result === false) {
      console.error(`Failed to open URL: ${url}`);
    }
  } catch (error) {
    console.error('Error opening external link:', error);
  }
}

// Обработчики безопасности для всех webContents
function setupWebContentsSecurity(contents: Electron.WebContents) {
  contents.on('will-navigate', (event, url) => {
    const allowed = url.startsWith(`http://localhost:${PORT}`) || url.startsWith('file://');
    if (!allowed) {
      event.preventDefault();
      safeOpenExternal(url);
    }
  });

  contents.setWindowOpenHandler(({ url }) => {
    safeOpenExternal(url);
    return { action: 'deny' };
  });

  contents.on('did-attach-webview', (_, webContents) => {
    webContents.on('will-navigate', (event, url) => {
      if (!url.startsWith(`http://localhost:${PORT}`) && !url.startsWith('file://')) {
        event.preventDefault();
        safeOpenExternal(url);
      }
    });
  });
}

app.whenReady().then(() => {
  const win = createWindow();

  setupWebContentsSecurity(win.webContents);

  // Обработка чтения файлов
  ipcMain.handle('read-file', async (_, filePath: string) => {
    try {
      return await fs.promises.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  });

  // Глобальный обработчик ошибок из рендерера
  win.webContents.on('ipc-message', (event, channel, ...args) => {
    if (channel === 'global-error') {
      const [error] = args;
      console.error('[RENDERER] Critical error:', error);
      win.webContents.send('show-alert', `Critical error: ${error}`);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Глобальные process handlers
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
  mainWindow?.webContents.send('global-error', error.message);
});

process.on('unhandledRejection', reason => {
  console.error('Unhandled Rejection:', reason);
  mainWindow?.webContents.send('global-error', String(reason));
});
