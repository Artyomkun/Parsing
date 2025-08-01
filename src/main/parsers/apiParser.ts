import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

// Общие функции для всех парсеров
const validateStringInput = (response: string, maxSize = 1000000) => {
  if (typeof response !== 'string') {
    throw new Error("Ожидается строковый формат данных");
  }
  if (response.length === 0) return '';
  if (response.length > maxSize) {
    throw new Error(`Размер данных превышает ${maxSize / 1000000} МБ`);
  }
  if (response.includes('\0')) {
    throw new Error("Данные содержат нулевые байты");
  }
  return response;
};

const normalizeText = (text: string) => {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\x00-\x1F\x7F-\x89]/g, ' ')
    .trim();
};

// Парсеры
export function parseTextResponse(response: string) {
  const validated = validateStringInput(response);
  return validated ? normalizeText(validated) : '';
}

export function parseXmlResponse(response: string) {
  const validated = validateStringInput(response);
  if (!validated) return '';
  
  const $ = cheerio.load(validated, { xmlMode: true });
  const root = $('root').first();
  
  if (root.length === 0) {
    throw new Error("XML не содержит корневого элемента <root>");
  }
  
  const text = root.text();
  if (!text.trim()) {
    throw new Error("Корневой элемент <root> пустой");
  }
  
  return normalizeText(text);
}

export function parseCsvResponse(response: string) {
  const validated = validateStringInput(response);
  if (!validated) return [];

  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < validated.length; i++) {
    const char = validated[i];

    switch (true) {
      case char === '"' && validated[i + 1] === '"':
        current += '"';
        i++;
        break;
      case char === '"':
        inQuotes = !inQuotes;
        break;
      case char === ',' && !inQuotes:
        row.push(current.trim());
        current = '';
        break;
      case (char === '\n' || char === '\r') && !inQuotes:
        if (char === '\r' && validated[i + 1] === '\n') i++;
        row.push(current.trim());
        rows.push(row);
        row = [];
        current = '';
        break;
      default:
        current += char;
    }
  }

  // Добавление последней строки
  if (current !== '' || row.length > 0) {
    row.push(current.trim());
    rows.push(row);
  }

  // Валидация CSV структуры
  if (rows.length > 1000) {
    throw new Error("CSV содержит более 1000 строк");
  }
  
  const cols = rows[0]?.length || 0;
  if (rows.some(r => r.length !== cols)) {
    throw new Error("Несовпадение количества столбцов в строках");
  }

  return rows;
}

export function parseJsonResponse(response: string) {
  try {
    return JSON.parse(response);
  } catch (error) {
    throw new Error(`Ошибка парсинга JSON: ${(error as Error).message}`);
  }
}

export function parseHtmlResponse(response: string) {
  const validated = validateStringInput(response);
  if (!validated) return '';
  
  const $ = cheerio.load(validated);
  const body = $('body');
  
  if (body.length === 0) {
    throw new Error("HTML не содержит тега <body>");
  }
  
  const text = body.text();
  if (!text.trim()) {
    throw new Error("Тег <body> не содержит текста");
  }
  
  return normalizeText(text);
}

export function parseMarkdownResponse(response: string) {
  const validated = validateStringInput(response);
  if (!validated) return '';
  
  // Упрощенная обработка Markdown
  return normalizeText(validated)
    .replace(/(#+ )|(\*\*?)|(__?)|(~~)|(`+)/g, ' ');
}

export function parsePlainTextResponse(response: string) {
  return parseTextResponse(response);
}

export function parseBinaryResponse(response: Buffer) {
  if (!Buffer.isBuffer(response)) {
    throw new Error("Ожидается бинарный формат данных (Buffer)");
  }
  if (response.length > 1000000) {
    throw new Error("Размер бинарных данных превышает 1 МБ");
  }
  return response.toString('base64');
}

export async function parseDynamicContent(url: string, selector: string): Promise<string[]> {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const results = await page.$$eval(selector, (elements: any[]) => 
      elements.map((el: { textContent: string; }) => el.textContent?.trim() || '')
    );

    if (results.length === 0) {
      throw new Error(`Элементы по селектору '${selector}' не найдены`);
    }

    return results.filter((text: string | any[]) => text.length > 0);
  } finally {
    await browser.close();
  }
}