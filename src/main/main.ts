import { app, BrowserWindow, ipcMain } from 'electron';
import * as cheerio from 'cheerio';
import * as puppeteer from 'puppeteer-core';
import * as path from 'path';

interface ParseConfig {
  type: string;
  data: string;
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:39143');
    mainWindow.webContents.openDevTools();
  } else {
    // Используем loadURL для загрузки файла
    mainWindow.loadURL(`file://${path.join(__dirname, '../renderer/index.html')}`);
  }

  return mainWindow;
}

app.whenReady().then(() => {
  const mainWindow = createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Реализация функций парсинга
async function parseHtmlContent(url: string, selector: string): Promise<string[]> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const results: string[] = [];
    
    $(selector).each((_, element) => {
      results.push($(element).text().trim());
    });
    
    return results;
  } catch (error) {
    throw new Error(`HTML parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function parseDynamicContent(url: string, selector: string): Promise<string[]> {
  let browser: puppeteer.Browser | null = null;
  try {
    browser = await puppeteer.launch({
      executablePath: puppeteer.executablePath(),
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      ignoreHTTPSErrors: true,
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });
    
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Дополнительное ожидание для динамического контента
    await page.waitForSelector(selector, { timeout: 10000 });
    
    return await page.$$eval(selector, elements => 
      elements.map(el => el.textContent?.trim() || '')
    );
  } catch (error) {
    throw new Error(`Dynamic content parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) await browser.close();
  }
}

// Обработчики IPC
ipcMain.handle('parse:html', async (_: IpcMainInvokeEvent, url: string, selector: string) => {
  try {
    const data = await parseHtmlContent(url, selector);
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to parse HTML' 
    };
  }
});

ipcMain.handle('parse:dynamic', async (_: IpcMainInvokeEvent, url: string, selector: string) => {
  try {
    const data = await parseDynamicContent(url, selector);
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to parse dynamic content' 
    };
  }
});

ipcMain.handle('parse:data', async (_: IpcMainInvokeEvent, config: ParseConfig) => {
  try {
    // Пример реализации - замените на вашу логику
    let result = '';
    switch (config.type) {
      case 'json':
        result = `JSON processed: ${JSON.stringify(JSON.parse(config.data), null, 2)}`;
        break;
      case 'xml':
        result = `XML processed: ${config.data.toUpperCase()}`;
        break;
      default:
        result = `Processed ${config.type}: ${config.data}`;
    }
    
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to parse data' 
    };
  }
});

// Обработка ошибок процесса
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});