const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const express = require('express');
const puppeteer = require('puppeteer');

// 1. Инициализация Express-сервера
const initServer = () => {
  const server = express();
  server.use(express.json());
  
  // API для парсинга CSV
  server.post('/parse/csv', (req, res) => {
    try {
      const parsed = req.body.data.split('\n').map(line => line.split(','));
      res.json(parsed);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // API для парсинга веб-страниц
  server.post('/parse/web', async (req, res) => {
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(req.body.url);
      
      const data = await page.evaluate(() => ({
        title: document.title,
        headers: Array.from(document.querySelectorAll('h1, h2, h3')).map(el => el.textContent.trim())
      }));
      
      await browser.close();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return server.listen(3000, () => console.log('API сервер запущен на порту 3000'));
};

// 2. Конфигурация Electron
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Загрузка React-приложения
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  // Кастомное меню
  const menuTemplate = [
    {
      label: 'Файл',
      submenu: [
        {
          label: 'Импорт CSV',
          click: () => mainWindow.webContents.send('import-csv')
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
          click: () => mainWindow.webContents.send('parse-web')
        }
      ]
    }
  ];
  
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}

// 3. IPC обработчики
function setupIPC() {
  // Чтение файлов
  ipcMain.handle('read-file', async (_, filePath) => {
    return fs.promises.readFile(filePath, 'utf-8');
  });

  // Сохранение результатов
  ipcMain.handle('save-result', async (_, { data, format = 'json' }) => {
    const outputPath = path.join(app.getPath('documents'), `parsed_${Date.now()}.${format}`);
    const content = format === 'json' 
      ? JSON.stringify(data, null, 2) 
      : data.map(row => row.join(',')).join('\n');
    
    await fs.promises.writeFile(outputPath, content);
    return outputPath;
  });
}

// 4. Главная функция
app.whenReady().then(() => {
  initServer(); // Запуск API
  createWindow(); // Создание окна
  setupIPC(); // Настройка IPC

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});