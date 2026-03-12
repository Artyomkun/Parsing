import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.ts'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // Загрузка Vite-сервера в разработке
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:39143');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'my-dynamic-site/index.html'));
  }

  // Обработчик для IPC
  ipcMain.on('show-message', (_, message) => {
    console.log('Message from renderer:', message);
    // Здесь можно показать диалоговое окно
  });

  // Обработчик закрытия окна
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});