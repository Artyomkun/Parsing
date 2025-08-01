import puppeteer, { Browser } from 'puppeteer';
import * as cheerio from 'cheerio';

// Общие константы
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5 MB
const BROWSER_TIMEOUT = 30000; // 30 секунд

/**
 * Парсинг динамического контента с использованием Puppeteer
 */
export const parseDynamicContent = async (
  url: string, 
  selector: string,
  options: { timeout?: number } = {}
): Promise<string[]> => {
  let browser: Browser | null = null;
  
  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Настройка таймаутов
    page.setDefaultNavigationTimeout(options.timeout || BROWSER_TIMEOUT);
    
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

    if (results.length === 0) {
      throw new Error(`Элементы по селектору "${selector}" не найдены на странице ${url}`);
    }

    return results.filter(text => text.length > 0);
  } catch (error) {
    throw new Error(`Ошибка при парсинге динамического контента: ${(error as Error).message}`);
  } finally {
    if (browser) await browser.close();
  }
};

/**
 * Парсинг статического HTML контента
 */
export const parseHTMLContent = async (
  url: string, 
  selector: string
): Promise<string[]> => {
  try {
    const response = await fetch(url);
    
    // Проверка размера контента
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
      throw new Error(`Размер HTML превышает ${MAX_RESPONSE_SIZE / 1024 / 1024}MB`);
    }

    const html = await response.text();
    
    // Проверка фактического размера
    if (html.length > MAX_RESPONSE_SIZE) {
      throw new Error(`Фактический размер HTML (${html.length} байт) превышает лимит`);
    }

    const $ = cheerio.load(html);
    const elements = $(selector);

    if (elements.length === 0) {
      throw new Error(`Элементы по селектору "${selector}" не найдены в HTML`);
    }

    return elements
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(text => text.length > 0);
  } catch (error) {
    throw new Error(`Ошибка при парсинге статического HTML: ${(error as Error).message}`);
  }
};

/**
 * Универсальный парсер HTML (статические страницы)
 */
export const parseHTML = async (
  url: string, 
  selector: string
): Promise<string[]> => {
  return parseHTMLContent(url, selector);
};