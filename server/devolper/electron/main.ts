import 'dotenv/config';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';
const SERVER_PORT = Number(process.env.SERVER_PORT) || 39143;
const PROJECT_ROOT = process.env.PROJECT_ROOT || __dirname;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: isDev
        ? path.join(PROJECT_ROOT, 'preload.ts')
        : path.join(PROJECT_ROOT, 'preload.js'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  const indexPath = isDev
    ? `http://localhost:${SERVER_PORT}`
    : path.join(PROJECT_ROOT, '.../my-dynamic-site/public/index.html');

  mainWindow.loadURL(indexPath).catch((err) => console.error('[MAIN] Failed to load:', err));

  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

function safeOpenExternal(url: string) {
  try {
    const parsedUrl = new URL(url);
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    if (!allowedProtocols.includes(parsedUrl.protocol)) return;

    const result = shell.openExternal(url);
    if (result && typeof result === 'object' && 'then' in result) {
      (result as Promise<void>).catch(console.error);
    } else if (result === false) console.error(`Failed to open URL: ${url}`);
  } catch (error) {
    console.error('Error opening external link:', error);
  }
}

app.whenReady().then(() => {
  const win = createWindow();

  ipcMain.handle('read-file', async (_, filePath: string) => {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  });

  app.on('web-contents-created', (_, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
      const isDevServer = navigationUrl.startsWith(`http://localhost:${SERVER_PORT}`);
      const isLocalFile = navigationUrl.startsWith('file://');
      if (!isDevServer && !isLocalFile) {
        event.preventDefault();
        safeOpenExternal(navigationUrl);
      }
    });

    contents.setWindowOpenHandler(({ url }) => {
      safeOpenExternal(url);
      return { action: 'deny' };
    });

    contents.on('did-attach-webview', (_, webContents) => {
      webContents.on('will-navigate', (event, url) => {
        // ✅ Исправлено: используем SERVER_PORT вместо MyApp_PORT
        if (!url.startsWith(`http://localhost:${SERVER_PORT}`) && !url.startsWith('file://')) {
          event.preventDefault();
          safeOpenExternal(url);
        }
      });
    });
  });
  
  // Global error handler
  win.webContents.on('ipc-message', (_, channel, ...args) => {
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

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  mainWindow?.webContents.send('global-error', error.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  mainWindow?.webContents.send('global-error', String(reason));
});