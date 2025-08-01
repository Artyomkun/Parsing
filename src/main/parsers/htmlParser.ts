import * as cheerio from 'cheerio';
import puppeteer, { Browser } from 'puppeteer';

// Конфигурационные константы
const BROWSER_TIMEOUT = 30000; // 30 секунд
const MAX_HTML_SIZE = 5 * 1024 * 1024; // 5 МБ

/**
 * Парсинг динамического контента с использованием Puppeteer
 */
export const parseDynamicContent = async (
  url: string,
  selector: string
): Promise<string[]> => {
  let browser: Browser | null = null;
  
  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Настройка таймаутов для надежности
    page.setDefaultNavigationTimeout(BROWSER_TIMEOUT);
    page.setDefaultTimeout(BROWSER_TIMEOUT);
    
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: BROWSER_TIMEOUT
    });
    
    // Ожидание появления элементов
    await page.waitForSelector(selector, {
      visible: true,
      timeout: BROWSER_TIMEOUT
    });

    const results = await page.$$eval(selector, elements => 
      elements.map(el => el.textContent?.trim() ?? '')
    );

    // Фильтрация и валидация результатов
    const filteredResults = results.filter(text => text.length > 0);
    
    if (filteredResults.length === 0) {
      const errorMessage = results.length > 0
        ? "Все элементы по указанному селектору пустые"
        : `Элементы по селектору "${selector}" не найдены`;
        
      throw new Error(errorMessage);
    }

    return filteredResults;
  } catch (error) {
    throw new Error(`Ошибка при парсинге динамического контента: ${(error as Error).message}`);
  } finally {
    if (browser) await browser.close();
  }
};

/**
 * Универсальный парсер статического HTML контента
 */
export const parseHTMLContent = async (
  url: string,
  selector: string
): Promise<string[]> => {
  try {
    // Загрузка HTML с проверкой размера
    const response = await fetch(url);
    
    // Проверка размера контента по заголовкам
    const contentLength = response.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_HTML_SIZE) {
      throw new Error(`Размер HTML превышает ${MAX_HTML_SIZE / 1024 / 1024} МБ`);
    }
    
    const html = await response.text();
    
    // Проверка фактического размера
    if (html.length > MAX_HTML_SIZE) {
      throw new Error(`Фактический размер HTML (${html.length} байт) превышает лимит`);
    }

    // Парсинг HTML
    const $ = cheerio.load(html);
    const elements = $(selector);
    
    // Валидация результатов
    if (elements.length === 0) {
      throw new Error(`Элементы по селектору "${selector}" не найдены`);
    }
    
    const results = elements
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(text => text.length > 0);
    
    if (results.length === 0) {
      throw new Error("Найдены элементы, но все они пустые");
    }
    
    return results;
  } catch (error) {
    throw new Error(`Ошибка при парсинге HTML: ${(error as Error).message}`);
  }
};

// Алиас для обратной совместимости
export const parseHTML = parseHTMLContent;