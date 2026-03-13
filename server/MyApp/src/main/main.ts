import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.ts'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || '');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'my-dynamic-site/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Handling IPC events
ipcMain.handle('some:event', async (_event: IpcMainInvokeEvent, _args: any) => {
  if (!mainWindow) {
    throw new Error('Main window is not available.');
  }

  try {
    // Your logic here
  } catch (error) {
    // Type assertion to 'unknown' to handle the various error types
    const err = error as Error;
    console.error('Error occurred:', err.message);
    throw new Error(err.message);
  }
});

// Add this to handle service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Your main application initialization
console.log('Application starting...');
// Add your framework initialization here (React, Vue, etc.)
// Application lifecycle
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});