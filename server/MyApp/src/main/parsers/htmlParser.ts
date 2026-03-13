import puppeteer, { Browser } from 'puppeteer';

// Constants
const BROWSER_TIMEOUT = 30000;
const MAX_URL_LENGTH = 2048;
const MAX_SELECTOR_LENGTH = 1000;

// Types
type ParseOptions = {
  attribute?: string;
  returnHtml?: boolean;
  timeout?: number;
  includeAttributes?: boolean;
};

type ParsedResult = {
  text: string;
  html?: string;
  attributes?: Record<string, string>;
};

const log = (msg: string, level: 'info' | 'warn' | 'error' = 'info') => {
  const prefix = `[Parser:${level.toUpperCase()}]`;
  console[level](`${prefix} ${msg}`);
};

// Validation Functions
const validateSelector = (selector: string) => {
  if (typeof selector !== 'string' || selector.trim().length === 0) {
    throw new Error('Селектор должен быть непустой строкой');
  }
  if (selector.length > MAX_SELECTOR_LENGTH) {
    throw new Error(`Селектор слишком длинный (макс. ${MAX_SELECTOR_LENGTH} символов)`);
  }
  const forbiddenPatterns = /[ >+~[\]:]|(::\w+)/;
  if (forbiddenPatterns.test(selector)) {
    throw new Error('Селектор содержит запрещенные символы или конструкции');
  }
};

const validateUrl = (url: string) => {
  if (typeof url !== 'string' || url.trim().length === 0) {
    throw new Error('URL должен быть непустой строкой');
  }
  if (url.length > MAX_URL_LENGTH) {
    throw new Error(`URL слишком длинный (макс. ${MAX_URL_LENGTH} символов)`);
  }
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Неподдерживаемый протокол');
    }
  } catch {
    throw new Error('Неверный формат URL');
  }
};

// General function for launching browser
const withBrowser = async <T>(fn: (browser: Browser) => Promise<T>): Promise<T> => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
};

// Parsing dynamic content
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

    log(`Открытие страницы: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });

    log(`Ожидание селектора: ${selector}`);
    await page.waitForSelector(selector, { visible: true, timeout });

    return page.$$eval(selector, (elements, opts: ParseOptions) => {
      return elements.map((element) => {
        const result: ParsedResult = {
          text: opts.attribute ? (element.getAttribute(opts.attribute) || '').trim() : (element.textContent || '').trim(),
        };

        if (opts.returnHtml) {
          result.html = element.outerHTML;
        }

        if (opts.includeAttributes) {
          result.attributes = Array.from(element.attributes).reduce((acc: Record<string, string>, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {});
        }

        return result;
      });
    }, options);
  });
};

// Parsing HTML content
const parseHTMLContent = async (selector: string, opts: ParseOptions): Promise<ParsedResult[]> => {
  const elements = document.querySelectorAll(selector);

  return Array.from(elements).map((element) => {
    const el = element as HTMLElement;
    const result: ParsedResult = {
      text: el.innerText.trim(),
    };

    if (opts.includeAttributes) {
      result.attributes = Array.from(el.attributes).reduce((acc: Record<string, string>, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {});
    }

    return result;
  });
};

// Alias for static parsing
export const parseHTML = parseHTMLContent;