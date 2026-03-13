import { app, BrowserWindow, ipcMain, Menu, MenuItemConstructorOptions } from 'electron';
import path from 'path';
import fs from 'fs';
import express, { Request, Response } from 'express';
import puppeteer from 'puppeteer';

// ===== 1. Инициализация Express-сервера =====
const initServer = () => {
  const server = express();
  server.use(express.json());

  // API для парсинга CSV
  server.post('/parse/csv', (req: Request, res: Response) => {
    try {
      const parsed = (req.body.data as string).split('\n').map(line => line.split(','));
      res.json(parsed);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: message });
    }
  });

  // API для парсинга веб-страниц
  server.post('/parse/web', async (req: Request, res: Response) => {
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(req.body.url);

      const data = await page.evaluate(() => ({
        title: document.title,
        headers: Array.from(document.querySelectorAll('h1, h2, h3')).map(el => el.textContent?.trim())
      }));

      await browser.close();
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: message });
    }
  });

  return server.listen(3000, () => console.log('API сервер запущен на порту 3000'));
};

// ===== 2. Конфигурация Electron =====
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.ts') // указываем JS/TS препроцессор
    }
  });

  // Загрузка React-приложения
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000'); // порт сервера
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'my-dynamic-site/index.html'));
  }

  // Кастомное меню
  const menuTemplate: MenuItemConstructorOptions[] = [
    {
      label: 'Файл',
      submenu: [
        {
          label: 'Импорт CSV',
          click: () => mainWindow?.webContents.send('import-csv')
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Парсинг',
      submenu: [
        {
          label: 'С сайта',
          click: () => mainWindow?.webContents.send('parse-web')
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}

// ===== 3. IPC обработчики =====
function setupIPC() {
  // Чтение файлов
  ipcMain.handle('read-file', async (_event, filePath: string) => {
    return fs.promises.readFile(filePath, 'utf-8');
  });

  // Сохранение результатов
  ipcMain.handle('save-result', async (_event, { data, format = 'json' }: { data: any; format?: string }) => {
    const outputPath = path.join(app.getPath('documents'), `parsed_${Date.now()}.${format}`);
    const content =
      format === 'json'
        ? JSON.stringify(data, null, 2)
        : (data as string[][]).map(row => row.join(',')).join('\n');

    await fs.promises.writeFile(outputPath, content);
    return outputPath;
  });
}

// ===== 4. Главная функция =====
app.whenReady().then(() => {
  initServer();
  createWindow();
  setupIPC();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Закрытие приложения
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
