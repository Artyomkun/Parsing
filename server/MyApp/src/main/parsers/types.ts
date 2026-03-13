import puppeteer, { Browser } from 'puppeteer';
import * as cheerio from 'cheerio';

// Константы
const BROWSER_TIMEOUT = 30000;
const MAX_HTML_SIZE = 100 * 1024 * 1024;
const MAX_URL_LENGTH = 2048;
const MAX_SELECTOR_LENGTH = 1000;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

// Базовый интерфейс для конфигурации парсинга
export interface ParseConfig {
  type: string;
  data: string;
}

// Опции для парсинга HTML/Dynamic контента
export interface ParseOptions {
  attribute?: string;
  returnHtml?: boolean;
  timeout?: number;
  selector?: string;
  includeAttributes?: boolean;
}

// Результат операции парсинга
export interface ParseResult {
  success: boolean;
  result?: any;
  error?: string;
}

// Типы для работы с элементами
export interface ParsedElement {
  text: string;
  html: string;
  [attr: string]: string | undefined;
}

// Улучшенный тип для результатов парсинга
export type ParsedResult = {
  text: string;
  html?: string;
  attributes?: Record<string, string>;
};

// Логирование
const log = (msg: string, level: 'info' | 'warn' | 'error' = 'info') => {
  const prefix = `[Parser:${level.toUpperCase()}]`;
  console[level](`${prefix} ${msg}`);
};

// Валидация
const validateSelector = (selector: string) => {
  if (typeof selector !== 'string' || selector.trim().length === 0) {
    throw new Error('Selector must be a non-empty string');
  }

  if (selector.length > MAX_SELECTOR_LENGTH) {
    throw new Error(`Selector too long (max ${MAX_SELECTOR_LENGTH} chars)`);
  }

  const forbiddenPatterns = [
    /[ >+~[\]:]/,
    /::\w+/
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(selector)) {
      throw new Error('Selector contains forbidden characters or constructs');
    }
  }
};

const validateUrl = (url: string) => {
  if (typeof url !== 'string' || url.trim().length === 0) {
    throw new Error('URL must be a non-empty string');
  }

  if (url.length > MAX_URL_LENGTH) {
    throw new Error(`URL too long (max ${MAX_URL_LENGTH} chars)`);
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Unsupported protocol');
    }
  } catch (e) {
    throw new Error('Invalid URL format');
  }
};

// Обертка для работы с браузером
const withBrowser = async <T>(fn: (browser: Browser) => Promise<T>): Promise<T> => {
  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    return await fn(browser);
  } finally {
    if (browser) await browser.close();
  }
};

// Динамический парсер
export const parseDynamicContent = async (
  url: string, 
  selector: string,
  options: ParseOptions = {}
): Promise<ParsedResult[]> => {
  validateUrl(url);
  validateSelector(selector);

  return withBrowser(async (browser) => {
    const page = await browser.newPage();
    const timeout = options.timeout || BROWSER_TIMEOUT;
    
    page.setDefaultNavigationTimeout(timeout);
    page.setDefaultTimeout(timeout);
    
    await page.setUserAgent(USER_AGENT);
    
    log(`Navigating to: ${url}`);
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout
    });
    
    log(`Waiting for selector: ${selector}`);
    await page.waitForSelector(selector, { 
      visible: true,
      timeout
    });
    
    return page.$$eval(selector, (elements, opts: ParseOptions) => {
      return elements.map(element => {
        const result: ParsedResult = {
          text: opts.attribute 
            ? (element.getAttribute(opts.attribute) || '').trim()
            : element.textContent?.trim() || ''
        };
        
        if (opts.returnHtml) {
          result.html = element.outerHTML;
        }
        
        if (opts.includeAttributes) {
          result.attributes = {};
          const attrs = Array.from(element.attributes);
          for (const attr of attrs) {
            result.attributes[attr.name] = attr.value;
          }
        }
        
        return result;
      });
    }, options);
  });
};

// Статический HTML парсер
export const parseHTMLContent = async (
  url: string, 
  selector: string,
  options: ParseOptions = {}
): Promise<ParsedResult[]> => {
  validateUrl(url);
  validateSelector(selector);
  
  log(`Fetching page: ${url}`);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  }
  
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    throw new Error('Response is not HTML');
  }
  
  const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_HTML_SIZE) {
    throw new Error(`HTML size exceeds ${MAX_HTML_SIZE / 1024 / 1024}MB`);
  }
  
  const html = await response.text();
  const $ = cheerio.load(html);
  const elements = $(selector);
  
  if (elements.length === 0) {
    throw new Error('No elements found');
  }
  
  const results: ParsedResult[] = [];
  
  elements.each((_, element) => {
    const el = $(element);
    const result: ParsedResult = {
      text: options.attribute 
        ? el.attr(options.attribute)?.trim() || ''
        : el.text().trim()
    };
    
    if (options.returnHtml) {
      result.html = el.html()?.trim() || '';
    }
    
    if (options.includeAttributes) {
      result.attributes = {};
      
      // Проверка типа элемента
      if (element.type === 'tag') {
        // Типизированный доступ к атрибутам
        for (const [name, value] of Object.entries(element.attribs)) {
          result.attributes[name] = value as string;
        }
      }
    }
    
    results.push(result);
  });
  
  if (results.length === 0 || results.every(r => r.text === '')) {
    throw new Error('All elements are empty');
  }
  
  return results;
};

// Диспетчер парсеров
export const parseDispatcher = async (
  config: ParseConfig,
  options: ParseOptions = {}
): Promise<ParseResult> => {
  try {
    let result: any;

    switch (config.type) {
      case 'dynamic':
        if (!options.selector) {
          throw new Error('Selector is required for dynamic parsing');
        }
        result = await parseDynamicContent(config.data, options.selector, options);
        break;

      case 'htmlContent':
        if (!options.selector) {
          throw new Error('Selector is required for HTML parsing');
        }
        result = await parseHTMLContent(config.data, options.selector, options);
        break;

      // Другие типы парсеров можно добавить здесь
      // case 'text':
      //   result = parseTextResponse(config.data);
      //   break;
      
      default:
        throw new Error(`Unsupported parser type: ${config.type}`);
    }

    return {
      success: true,
      result
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Parser error: ${errorMessage}`, 'error');
    
    return {
      success: false,
      error: errorMessage
    };
  }
};