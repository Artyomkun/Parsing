import { app, BrowserWindow } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.ts') // если есть
    }
  });

  // Загрузить index.html
  mainWindow.loadFile(path.join(__dirname, 'my-dynamic-site/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Инициализация приложения
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});