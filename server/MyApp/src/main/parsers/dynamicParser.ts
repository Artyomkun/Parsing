import puppeteer, { Browser, Page } from 'puppeteer';
import { createHash } from 'crypto';

// ======== Константы ========
const DEFAULT_BROWSER_TIMEOUT = 30000; // ms
const DEFAULT_ELEMENT_TIMEOUT = 10000; // ms
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36';
const MAX_SELECTOR_LENGTH = 1000;

// ======== Типы ========
export interface ParseOptions {
  timeout?: number; // Таймаут ожидания элемента
  proxy?: string;
  cookies?: Array<{ name: string; value: string; domain: string }>;
  headers?: Record<string, string>;
  returnHtml?: boolean;
}

export interface ParsedResult {
  text: string;
  html?: string;
  attributes?: Record<string, string>;
}

// ======== BrowserPool ========
class BrowserPool {
  private static instance: BrowserPool;
  private browsers: Browser[] = [];
  private inUse: Set<Browser> = new Set();
  private pending: Array<(browser: Browser) => void> = [];
  private POOL_SIZE = 3;

  private constructor() {}

  public static async getInstance(): Promise<BrowserPool> {
    if (!this.instance) {
      this.instance = new BrowserPool();
      await this.instance.initialize();
    }
    return this.instance;
  }

  private async initialize(): Promise<void> {
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      this.browsers.push(browser);
    }
  }

  public async acquire(): Promise<Browser> {
    const available = this.browsers.find(b => !this.inUse.has(b) && b.isConnected());
    if (available) {
      this.inUse.add(available);
      return available;
    }
    return new Promise(resolve => this.pending.push(resolve));
  }

  public release(browser: Browser): void {
    this.inUse.delete(browser);
    const next = this.pending.shift();
    if (next) {
      this.inUse.add(browser);
      next(browser);
    }
  }

  public async closeAll(): Promise<void> {
    await Promise.all(this.browsers.map(b => b.close()));
    this.browsers = [];
    this.inUse.clear();
  }
}

// ======== Вспомогательные функции ========
const validateSelector = (selector: string): void => {
  if (!selector || selector.length > MAX_SELECTOR_LENGTH) {
    throw new Error(`Invalid selector: "${selector}"`);
  }
};

const validateUrl = (url: string): URL => {
  try {
    return new URL(url);
  } catch {
    throw new Error(`Invalid URL: "${url}"`);
  }
};

export const generateContentHash = (content: string): string => {
  return createHash('sha256').update(content).digest('hex');
};

// ======== Функция извлечения элементов ========
async function extractElements(page: Page, selector: string, options: ParseOptions): Promise<ParsedResult[]> {
  const elementTimeout = options.timeout || DEFAULT_ELEMENT_TIMEOUT;
  await page.waitForSelector(selector, { timeout: elementTimeout });

  return page.$$eval(selector, (elements, returnHtml) => {
    return elements.map(el => {
      const attributes: Record<string, string> = {};
      Array.from(el.attributes).forEach(attr => (attributes[attr.name] = attr.value));
      return {
        text: el.textContent?.trim() || '',
        html: returnHtml ? el.outerHTML : undefined,
        attributes,
      };
    });
  }, options.returnHtml ?? false);
}

// ======== Главная функция парсинга ========
export const parseDynamicContent = async (
  url: string,
  selector: string,
  options: ParseOptions = {}
): Promise<ParsedResult[]> => {
  validateUrl(url);
  validateSelector(selector);

  const pool = await BrowserPool.getInstance();
  const browser = await pool.acquire();
  let page: Page | null = null;

  try {
    page = await browser.newPage();

    // User-Agent и заголовки
    await page.setUserAgent(options.headers?.['User-Agent'] || DEFAULT_USER_AGENT);
    if (options.headers) await page.setExtraHTTPHeaders(options.headers);

    // Cookies
    if (options.cookies) await page.setCookie(...options.cookies);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: options.timeout || DEFAULT_BROWSER_TIMEOUT });

    return await extractElements(page, selector, options);
  } catch (error) {
    throw new Error(`Parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (page) await page.close();
    pool.release(browser);
  }
};

// ======== Graceful shutdown ========
process.on('SIGINT', async () => {
  if (BrowserPool['instance']) {
    const pool = await BrowserPool.getInstance();
    await pool.closeAll();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (BrowserPool['instance']) {
    const pool = await BrowserPool.getInstance();
    await pool.closeAll();
  }
  process.exit(0);
});
