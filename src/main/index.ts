import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { parseHTML } from './parsers/htmlParser';
import { parseDynamicContent } from './parsers/dynamicParser';
import logger from 'electron-log';

// Настройка логгера
logger.transports.file.level = 'info';
logger.transports.console.level = 'debug';

// Валидация URL
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Валидация CSS селектора
const isValidSelector = (selector: string): boolean => {
  return typeof selector === 'string' && selector.trim().length > 0;
};

ipcMain.handle('parse:html', async (event: IpcMainInvokeEvent, url: string, selector: string) => {
  try {
    // Логирование запроса
    logger.info(`HTML parse request: ${url}, selector: ${selector}`);
    
    // Валидация входных данных
    if (!isValidUrl(url)) {
      throw new Error('Некорректный URL');
    }
    
    if (!isValidSelector(selector)) {
      throw new Error('Некорректный CSS селектор');
    }
    
    // Выполнение парсинга
    const result = await parseHTML(url, selector);
    logger.debug(`HTML parse success: ${result.length} элементов найдено`);
    return result;
    
  } catch (error) {
    // Обработка и логирование ошибок
    const errorMessage = (error as Error).message || 'Неизвестная ошибка при парсинге HTML';
    logger.error(`HTML parse error: ${errorMessage}`, { url, selector });
    throw new Error(errorMessage);
  }
});

ipcMain.handle('parse:dynamic', async (event: IpcMainInvokeEvent, url: string, selector: string) => {
  try {
    // Логирование запроса
    logger.info(`Dynamic parse request: ${url}, selector: ${selector}`);
    
    // Валидация входных данных
    if (!isValidUrl(url)) {
      throw new Error('Некорректный URL');
    }
    
    if (!isValidSelector(selector)) {
      throw new Error('Некорректный CSS селектор');
    }
    
    // Выполнение парсинга
    const result = await parseDynamicContent(url, selector);
    logger.debug(`Dynamic parse success: ${result.length} элементов найдено`);
    return result;
    
  } catch (error) {
    // Обработка и логирование ошибок
    const errorMessage = (error as Error).message || 'Неизвестная ошибка при динамическом парсинге';
    logger.error(`Dynamic parse error: ${errorMessage}`, { url, selector });
    throw new Error(errorMessage);
  }
});

// Обработка ошибок приложения
process.on('uncaughtException', (error) => {
  logger.error('Необработанная ошибка:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Необработанное отклонение промиса:', reason, promise);
});

