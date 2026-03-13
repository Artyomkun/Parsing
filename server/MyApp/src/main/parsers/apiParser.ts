import * as cheerio from 'cheerio';
import puppeteer, { Browser, Page } from 'puppeteer';
import { parse as papaParse } from 'papaparse';

// Configuration constants
const BROWSER_TIMEOUT = 30000;
const MAX_HTML_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_ELEMENTS = 1000;
const MAX_COLUMNS = 100;
const MAX_CELL_SIZE = 1000;

// Custom error classes
class ParserError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ParserError';
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class BrowserError extends ParserError {
  constructor(message: string) {
    super(message, 'BROWSER_ERROR');
  }
}

// Input validation
const validateInput = (
  input: string | Buffer,
  type: 'string' | 'buffer',
  maxSize: number,
  encoding: BufferEncoding = 'utf-8'
): string => {
  // Type guards для лучшего контроля типов
  if (type === 'string') {
    if (typeof input !== 'string') {
      throw new ValidationError("Expected string input");
    }
    if (!input) return '';
    if (input.length > maxSize) {
      throw new ValidationError(`Data size exceeds ${maxSize / 1_000_000} MB`);
    }
    return input;
  } else {
    if (!Buffer.isBuffer(input)) {
      throw new ValidationError("Expected Buffer input");
    }
    const content = input.toString(encoding);
    if (!content) return '';
    if (content.length > maxSize) {
      throw new ValidationError(`Data size exceeds ${maxSize / 1_000_000} MB`);
    }
    return content;
  }
};

export const validateStringContent = (content: string): string => {
  const forbiddenPatterns: [RegExp, string][] = [
    [/\0/g, "Data contains null bytes"],
    [/[\r\n]+/g, "Data contains illegal new lines"],
    [/.{1001,}/g, "Data contains a line longer than 1000 characters"],
    [/\t/g, "Data contains tabs"],
  ];

  for (const [pattern, message] of forbiddenPatterns) {
    if (pattern.test(content)) {
      throw new ValidationError(message);
    }
  }

  return content.trim();
};

// Text normalization
const normalizeText = (text: string): string => text.replace(/\s+/g, ' ').trim();

// Core parser functions
export const parseText = (input: string): string => {
  const content = validateInput(input, 'string', 1_000_000);
  return content ? normalizeText(content) : '';
};

export const parseXml = (input: string): string => {
  const content = validateInput(input, 'string', MAX_HTML_SIZE);
  const $ = cheerio.load(content, { xmlMode: true });

  const root = $('root').first();
  if (!root.length) throw new ValidationError("XML does not contain root <root> element");
  const text = root.text().trim();
  if (!text) throw new ValidationError("Root element <root> is empty");

  return normalizeText(text);
};

export const parseCsv = (input: string): string[][] => {
  const content = validateInput(input, 'string', MAX_HTML_SIZE);

  const result = papaParse<string[]>(content, {
    header: false,
    skipEmptyLines: true,
    transform: (value: string) => value.trim(),
  });

  if (result.errors.length) {
    throw new ValidationError(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`);
  }

  const data: string[][] = result.data as string[][];
  if (data.length > MAX_ELEMENTS) throw new ValidationError(`CSV contains more than ${MAX_ELEMENTS} rows`);

  const colCount = data[0]?.length ?? 0;
  if (colCount > MAX_COLUMNS) throw new ValidationError(`CSV contains more than ${MAX_COLUMNS} columns`);

  data.forEach(row => {
    if (row.length !== colCount) throw new ValidationError("Row column count mismatch");
    row.forEach(cell => {
      if (cell.length > MAX_CELL_SIZE) throw new ValidationError(`Cell content exceeds ${MAX_CELL_SIZE} characters`);
    });
  });

  return data;
};

export const parseJson = <T = unknown>(input: string): T => {
  const content = validateInput(input, 'string', MAX_HTML_SIZE);
  try {
    return JSON.parse(content) as T;
  } catch (error) {
    throw new ParserError(`JSON parsing failed: ${error instanceof Error ? error.message : String(error)}`, 'JSON_PARSE_ERROR');
  }
};

export const parseHtml = (input: string): string => {
  const content = validateInput(input, 'string', MAX_HTML_SIZE);
  const $ = cheerio.load(content);

  const body = $('body');
  if (!body.length) throw new ValidationError("HTML does not contain <body> tag");

  const text = body.text().trim();
  if (!text) throw new ValidationError("<body> tag contains no text");

  return normalizeText(text);
};

export const parseMarkdown = (input: string): string => {
  const content = validateInput(input, 'string', MAX_HTML_SIZE);
  return normalizeText(content).replace(/(#+ )|(\*\*?)|(__?)|(~~)|(`+)/g, ' ');
};

export const parseBinary = (input: Buffer): string => {
  validateInput(input, 'buffer', 1_000_000);
  return input.toString('base64');
};

// Browser management
interface BrowserInstance {
  browser: Browser;
  page: Page;
}

const browserPool: BrowserInstance[] = [];
const MAX_POOL_SIZE = 2;

const createBrowserInstance = async (): Promise<BrowserInstance> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36');
  await page.setDefaultNavigationTimeout(BROWSER_TIMEOUT);
  await page.setDefaultTimeout(BROWSER_TIMEOUT);

  return { browser, page };
};

const getBrowserInstance = async (): Promise<BrowserInstance> => {
  if (browserPool.length > 0) return browserPool.pop() as BrowserInstance;
  return createBrowserInstance();
};

const releaseBrowserInstance = (instance: BrowserInstance) => {
  if (browserPool.length < MAX_POOL_SIZE) browserPool.push(instance);
  else instance.browser.close();
};

// Dynamic content parsing
export interface ParsedElement {
  text: string;
  html?: string;
  attributes?: Record<string, string>;
}

export interface ParseOptions {
  url: string;
  selector: string;
  attribute?: string;
  returnHtml?: boolean;
  includeAttributes?: boolean;
  waitForSelector?: string;
  waitForTimeout?: number;
}

export const parseDynamicContent = async (options: ParseOptions): Promise<ParsedElement[]> => {
  let instance: BrowserInstance | null = null;

  try {
    instance = await getBrowserInstance();
    const { page } = instance;

    await page.goto(options.url, { waitUntil: 'domcontentloaded', timeout: BROWSER_TIMEOUT });

    if (options.waitForSelector) {
      await page.waitForSelector(options.waitForSelector, { timeout: options.waitForTimeout || BROWSER_TIMEOUT });
    }

    const result = await page.$$eval(
      options.selector,
      (elements, opts: { attribute?: string; returnHtml?: boolean; includeAttributes?: boolean }) =>
        elements.map(el => ({
          text: opts.attribute ? (el.getAttribute(opts.attribute) || '').trim() : (el.textContent || '').trim(),
          html: opts.returnHtml ? el.outerHTML : undefined,
          attributes: opts.includeAttributes ? Object.fromEntries(Array.from(el.attributes).map(a => [a.name, a.value])) : undefined
        })),
      {
        attribute: options.attribute,
        returnHtml: options.returnHtml,
        includeAttributes: options.includeAttributes
      }
    );

    if (result.length === 0) throw new BrowserError(`No elements found for selector: ${options.selector}`);
    if (result.length > MAX_ELEMENTS) throw new BrowserError(`Found too many elements (${result.length})`);

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown browser error';
    throw new BrowserError(`Dynamic content parsing failed: ${message}`);
  } finally {
    if (instance) releaseBrowserInstance(instance);
  }
};

// Cleanup
export const cleanupBrowserPool = async (): Promise<void> => {
  await Promise.all(browserPool.map(async instance => await instance.browser.close()));
  browserPool.length = 0;
};

// Добавьте это в конец файла apiParser.ts
export default {
  parseText,
  parseXml,
  parseCsv,
  parseJson,
  parseHtml,
  parseMarkdown,
  parseBinary,
  parseDynamicContent,
  cleanupBrowserPool,
  validateStringContent
};