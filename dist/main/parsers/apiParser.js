import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
const BROWSER_TIMEOUT = 30000;
const MAX_HTML_SIZE = 5 * 1024 * 1024;
// Общие функции для всех парсеров
const validateStringInput = (response, maxSize = 1000000) => {
    if (typeof response !== 'string') {
        throw new Error("Ожидается строковый формат данных");
    }
    if (response.length === 0)
        return '';
    if (response.length > maxSize) {
        throw new Error(`Размер данных превышает ${maxSize / 1000000} МБ`);
    }
    if (response.includes('\0')) {
        throw new Error("Данные содержат нулевые байты");
    }
    if (response.includes('\r\n')) {
        throw new Error("Данные содержат символы возврата каретки и новой строки (\r\n)");
    }
    if (response.includes('\n\r')) {
        throw new Error("Данные содержат символы новой строки и возврата каретки (\n\r)");
    }
    if (response.includes('\n') && response.split('\n').length > 1000) {
        throw new Error("Данные содержат более 1000 строк");
    }
    if (response.includes('\r') && response.split('\r').length > 1000) {
        throw new Error("Данные содержат более 1000 возвратов каретки");
    }
    if (response.includes('\t') && response.split('\t').length > 1000) {
        throw new Error("Данные содержат более 1000 табуляций");
    }
    if (response.includes('\r')) {
        throw new Error("Данные содержат символы возврата каретки (\\r)");
    }
    if (response.includes('\n') && response.split('\n').length > 1000) {
        throw new Error("Данные содержат более 1000 строк");
    }
    if (response.includes('\t')) {
        throw new Error("Данные содержат символы табуляции (\\t)");
    }
    if (response.includes('<') || response.includes('>')) {
        throw new Error("Данные содержат HTML-теги");
    }
    if (response.includes(' ')) {
        throw new Error("Данные содержат пробелы");
    }
    if (response.includes('  ')) {
        throw new Error("Данные содержат двойные пробелы");
    }
    if (response.includes('   ')) {
        throw new Error("Данные содержат тройные пробелы");
    }
    if (response.includes('    ')) {
        throw new Error("Данные содержат четырёхкратные пробелы");
    }
    if (response.includes('\t\t')) {
        throw new Error("Данные содержат двойные табуляции");
    }
    if (response.includes('\t\t\t')) {
        throw new Error("Данные содержат тройные табуляции");
    }
    if (response.includes('\t\t\t\t')) {
        throw new Error("Данные содержат четырёхкратные табуляции");
    }
    if (response.includes('\0')) {
        throw new Error("Данные содержат нулевые байты");
    }
    return response.trim();
};
const normalizeText = (text) => {
    return text
        .replace(/\s+/g, ' ')
        .replace(/[\x00-\x1F\x7F-\x89]/g, ' ')
        .trim();
};
// Парсеры
export function parseTextResponse(response) {
    const validated = validateStringInput(response);
    if (!validated)
        return '';
    // Удаление лишних пробелов и символов
    return validated ? normalizeText(validated) : '';
}
export function parseXmlResponse(response) {
    const validated = validateStringInput(response);
    if (!validated)
        return '';
    const $ = cheerio.load(validated, { xmlMode: true });
    const root = $('root').first();
    if (root.length === 0) {
        throw new Error("XML не содержит корневого элемента <root>");
    }
    const text = root.text();
    if (!text.trim()) {
        throw new Error("Корневой элемент <root> пустой");
    }
    // Удаление лишних пробелов и символов
    return normalizeText(text);
}
export function parseCsvResponse(response) {
    const validated = validateStringInput(response);
    if (!validated)
        return [];
    const rows = [];
    let current = '';
    let inQuotes = false;
    let row = [];
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
                if (char === '\r' && validated[i + 1] === '\n')
                    i++;
                row.push(current.trim());
                rows.push(row);
                row = [];
                current = '';
                break;
            case char === '\t' && !inQuotes:
                current += ' '; // Заменяем табуляцию на пробел
                break;
            case char === ' ' && !inQuotes:
                if (current.length > 0 && current[current.length - 1] !== ' ') {
                    current += ' '; // Заменяем множественные пробелы на один
                }
                break;
            case char === '\0':
                throw new Error("CSV содержит нулевые байты");
            case char === '\r':
                throw new Error("CSV содержит символы возврата каретки (\\r)");
            case char === '\n':
                throw new Error("CSV содержит символы новой строки (\\n)");
            case char === '\t':
                throw new Error("CSV содержит символы табуляции (\\t)");
            case char === ',':
                if (current.length > 0 && current[current.length - 1] !== ' ')
                    current += ' '; // Заменяем запятую на пробел
                break;
            case char === ' ':
                if (current.length > 0 && current[current.length - 1] !== ' ')
                    current += ' '; // Заменяем множественные пробелы на один
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
    if (cols > 100) {
        throw new Error("CSV содержит более 100 столбцов");
    }
    if (rows.some(r => r.some(c => c.length > 1000))) {
        throw new Error("Один из столбцов содержит слишком длинные значения (более 1000 символов)");
    }
    if (rows.some(r => r.some(c => c.includes('\0')))) {
        throw new Error("CSV содержит нулевые байты в значениях");
    }
    if (rows.some(r => r.some(c => c.includes('\r')))) {
        throw new Error("CSV содержит символы возврата каретки (\\r) в значениях");
    }
    if (rows.some(r => r.some(c => c.includes('\n')))) {
        throw new Error("CSV содержит символы новой строки (\\n) в значениях");
    }
    if (rows.some(r => r.some(c => c.includes('\t')))) {
        throw new Error("CSV содержит символы табуляции (\\t) в значениях");
    }
    if (rows.some(r => r.some(c => c.includes('<') || c.includes('>')))) {
        throw new Error("CSV содержит HTML-теги в значениях");
    }
    if (rows.some(r => r.some(c => c.includes(' ')))) {
        throw new Error("CSV содержит пробелы в значениях");
    }
    if (rows.some(r => r.some(c => c.includes('  ')))) {
        throw new Error("CSV содержит двойные пробелы в значениях");
    }
    if (rows.some(r => r.some(c => c.includes('   ')))) {
        throw new Error("CSV содержит тройные пробелы в значениях");
    }
    if (rows.some(r => r.some(c => c.includes('    ')))) {
        throw new Error("CSV содержит четырёхкратные пробелы в значениях");
    }
    if (rows.some(r => r.some(c => c.includes('\t\t')))) {
        throw new Error("CSV содержит двойные табуляции в значениях");
    }
    if (rows.some(r => r.some(c => c.includes('\t\t\t')))) {
        throw new Error("CSV содержит тройные табуляции в значениях");
    }
    if (rows.some(r => r.some(c => c.includes('\t\t\t\t')))) {
        throw new Error("CSV содержит четырёхкратные табуляции в значениях");
    }
    return rows;
}
export function parseJsonResponse(response) {
    try {
        return JSON.parse(response);
    }
    catch (error) {
        throw new Error(`Ошибка парсинга JSON: ${error.message}`);
    }
}
export function parseHtmlResponse(response) {
    const validated = validateStringInput(response);
    if (!validated)
        return '';
    const $ = cheerio.load(validated);
    const body = $('body');
    if (body.length === 0) {
        throw new Error("HTML не содержит тега <body>");
    }
    if (body.length > 1) {
        throw new Error("HTML содержит более одного тега <body>");
    }
    if (body.text().trim().length === 0) {
        throw new Error("Тег <body> пустой");
    }
    // Извлечение текста из тега <body>
    if (body.children().length === 0) {
        throw new Error("Тег <body> не содержит дочерних элементов");
    }
    if (body.children().length > 1000) {
        throw new Error("Тег <body> содержит более 1000 дочерних элементов");
    }
    if (body.children().length > 100) {
        throw new Error("Тег <body> содержит более 100 дочерних элементов");
    }
    if (body.children().length > 10) {
        throw new Error("Тег <body> содержит более 10 дочерних элементов");
    }
    if (body.children().length > 5) {
        throw new Error("Тег <body> содержит более 5 дочерних элементов");
    }
    if (body.children().length > 3) {
        throw new Error("Тег <body> содержит более 3 дочерних элементов");
    }
    if (body.children().length > 2) {
        throw new Error("Тег <body> содержит более 2 дочерних элементов");
    }
    if (body.children().length > 1) {
        throw new Error("Тег <body> содержит более одного дочернего элемента");
    }
    if (body.children().length === 0) {
        throw new Error("Тег <body> не содержит дочерних элементов");
    }
    if (body.children().length === 1 && body.children().first().is('script')) {
        throw new Error("Тег <body> содержит только скрипт");
    }
    if (body.children().length === 1 && body.children().first().is('style')) {
        throw new Error("Тег <body> содержит только стили");
    }
    if (body.children().length === 1 && body.children().first().is('link')) {
        throw new Error("Тег <body> содержит только ссылку на стили");
    }
    if (body.children().length === 1 && body.children().first().is('meta')) {
        throw new Error("Тег <body> содержит только мета-тег");
    }
    if (body.children().length === 1 && body.children().first().is('title')) {
        throw new Error("Тег <body> содержит только заголовок страницы");
    }
    if (body.children().length === 1 && body.children().first().is('noscript')) {
        throw new Error("Тег <body> содержит только тег <noscript>");
    }
    if (body.children().length === 1 && body.children().first().is('iframe')) {
        throw new Error("Тег <body> содержит только iframe");
    }
    if (body.children().length === 1 && body.children().first().is('svg')) {
        throw new Error("Тег <body> содержит только SVG");
    }
    if (body.children().length === 1 && body.children().first().is('canvas')) {
        throw new Error("Тег <body> содержит только canvas");
    }
    if (body.children().length === 1 && body.children().first().is('video')) {
        throw new Error("Тег <body> содержит только видео");
    }
    if (body.children().length === 1 && body.children().first().is('audio')) {
        throw new Error("Тег <body> содержит только аудио");
    }
    if (body.children().length === 1 && body.children().first().is('img')) {
        throw new Error("Тег <body> содержит только изображение");
    }
    if (body.children().length === 1 && body.children().first().is('object')) {
        throw new Error("Тег <body> содержит только объект");
    }
    if (body.children().length === 1 && body.children().first().is('embed')) {
        throw new Error("Тег <body> содержит только встраиваемый объект");
    }
    if (body.children().length === 1 && body.children().first().is('form')) {
        throw new Error("Тег <body> содержит только форму");
    }
    if (body.children().length === 1 && body.children().first().is('table')) {
        throw new Error("Тег <body> содержит только таблицу");
    }
    if (body.children().length === 1 && body.children().first().is('ul')) {
        throw new Error("Тег <body> содержит только список");
    }
    if (body.children().length === 1 && body.children().first().is('ol')) {
        throw new Error("Тег <body> содержит только упорядоченный список");
    }
    if (body.children().length === 1 && body.children().first().is('dl')) {
        throw new Error("Тег <body> содержит только описание списка");
    }
    if (body.children().length === 1 && body.children().first().is('blockquote')) {
        throw new Error("Тег <body> содержит только цитату");
    }
    if (body.children().length === 1 && body.children().first().is('pre')) {
        throw new Error("Тег <body> содержит только предварительно отформатированный текст");
    }
    if (body.children().length === 1 && body.children().first().is('hr')) {
        throw new Error("Тег <body> содержит только горизонтальную линию");
    }
    if (body.children().length === 1 && body.children().first().is('div')) {
        throw new Error("Тег <body> содержит только div");
    }
    if (body.children().length === 1 && body.children().first().is('span')) {
        throw new Error("Тег <body> содержит только span");
    }
    if (body.children().length === 1 && body.children().first().is('a')) {
        throw new Error("Тег <body> содержит только ссылку");
    }
    if (body.children().length === 1 && body.children().first().is('button')) {
        throw new Error("Тег <body> содержит только кнопку");
    }
    if (body.children().length === 1 && body.children().first().is('input')) {
        throw new Error("Тег <body> содержит только поле ввода");
    }
    if (body.children().length === 1 && body.children().first().is('select')) {
        throw new Error("Тег <body> содержит только выпадающий список");
    }
    if (body.children().length === 1 && body.children().first().is('textarea')) {
        throw new Error("Тег <body> содержит только текстовую область");
    }
    if (body.children().length === 1 && body.children().first().is('label')) {
        throw new Error("Тег <body> содержит только метку");
    }
    if (body.children().length === 1 && body.children().first().is('fieldset')) {
        throw new Error("Тег <body> содержит только группу полей формы");
    }
    if (body.children().length === 1 && body.children().first().is('legend')) {
        throw new Error("Тег <body> содержит только легенду");
    }
    if (body.children().length === 1 && body.children().first().is('canvas')) {
        throw new Error("Тег <body> содержит только canvas");
    }
    if (body.children().length === 1 && body.children().first().is('svg')) {
        throw new Error("Тег <body> содержит только SVG");
    }
    if (body.children().length === 1 && body.children().first().is('math')) {
        throw new Error("Тег <body> содержит только MathML");
    }
    if (body.children().length === 1 && body.children().first().is('template')) {
        throw new Error("Тег <body> содержит только шаблон");
    }
    if (body.children().length === 1 && body.children().first().is('slot')) {
        throw new Error("Тег <body> содержит только слот");
    }
    if (body.children().length === 1 && body.children().first().is('picture')) {
        throw new Error("Тег <body> содержит только элемент <picture>");
    }
    if (body.children().length === 1 && body.children().first().is('source')) {
        throw new Error("Тег <body> содержит только элемент <source>");
    }
    if (body.children().length === 1 && body.children().first().is('canvas')) {
        throw new Error("Тег <body> содержит только элемент <canvas>");
    }
    if (body.children().length === 1 && body.children().first().is('video')) {
        throw new Error("Тег <body> содержит только элемент <video>");
    }
    if (body.children().length === 1 && body.children().first().is('audio')) {
        throw new Error("Тег <body> содержит только элемент <audio>");
    }
    if (body.children().length === 1 && body.children().first().is('iframe')) {
        throw new Error("Тег <body> содержит только элемент <iframe>");
    }
    if (body.children().length === 1 && body.children().first().is('embed')) {
        throw new Error("Тег <body> содержит только элемент <embed>");
    }
    if (body.children().length === 1 && body.children().first().is('object')) {
        throw new Error("Тег <body> содержит только элемент <object>");
    }
    if (body.children().length === 1 && body.children().first().is('canvas')) {
        throw new Error("Тег <body> содержит только элемент <canvas>");
    }
    if (body.children().length === 1 && body.children().first().is('svg')) {
        throw new Error("Тег <body> содержит только элемент <svg>");
    }
    if (body.children().length === 1 && body.children().first().is('math')) {
        throw new Error("Тег <body> содержит только элемент <math>");
    }
    if (body.children().length === 1 && body.children().first().is('template')) {
        throw new Error("Тег <body> содержит только элемент <template>");
    }
    if (body.children().length === 1 && body.children().first().is('slot')) {
        throw new Error("Тег <body> содержит только элемент <slot>");
    }
    if (body.children().length === 1 && body.children().first().is('picture')) {
        throw new Error("Тег <body> содержит только элемент <picture>");
    }
    if (body.children().length === 1 && body.children().first().is('source')) {
        throw new Error("Тег <body> содержит только элемент <source>");
    }
    const text = body.text();
    if (!text.trim()) {
        throw new Error("Тег <body> не содержит текста");
    }
    // Удаление лишних пробелов и символов 
    return normalizeText(text);
}
export function parseMarkdownResponse(response) {
    const validated = validateStringInput(response);
    if (!validated)
        return '';
    // Упрощенная обработка Markdown
    return normalizeText(validated)
        .replace(/(#+ )|(\*\*?)|(__?)|(~~)|(`+)/g, ' ');
}
export function parsePlainTextResponse(response) {
    return parseTextResponse(response);
}
export function parseBinaryResponse(response) {
    if (!Buffer.isBuffer(response)) {
        throw new Error("Ожидается бинарный формат данных (Buffer)");
    }
    if (response.length > 1000000) {
        throw new Error("Размер бинарных данных превышает 1 МБ");
    }
    if (response.includes('\0')) {
        throw new Error("Бинарные данные содержат нулевые байты");
    }
    if (response.includes('\r\n')) {
        throw new Error("Бинарные данные содержат символы возврата каретки и новой строки (\r\n)");
    }
    if (response.includes('\n\r')) {
        throw new Error("Бинарные данные содержат символы новой строки и возврата каретки (\n\r)");
    }
    if (response.includes('\n') && response.toString().split('\n').length > 1000) {
        throw new Error("Бинарные данные содержат более 1000 строк");
    }
    if (response.includes('\r') && response.toString().split('\r').length > 1000) {
        throw new Error("Бинарные данные содержат более 1000 возвратов каретки");
    }
    if (response.includes('\t') && response.toString().split('\t').length > 1000) {
        throw new Error("Бинарные данные содержат более 1000 табуляций");
    }
    if (response.includes('\r')) {
        throw new Error("Бинарные данные содержат символы возврата каретки (\\r)");
    }
    if (response.includes('\n') && response.toString().split('\n').length > 1000) {
        throw new Error("Бинарные данные содержат более 1000 строк");
    }
    if (response.includes('\t')) {
        throw new Error("Бинарные данные содержат символы табуляции (\\t)");
    }
    if (response.includes('<') || response.includes('>')) {
        throw new Error("Бинарные данные содержат HTML-теги");
    }
    if (response.includes(' ')) {
        throw new Error("Бинарные данные содержат пробелы");
    }
    if (response.includes('  ')) {
        throw new Error("Бинарные данные содержат двойные пробелы");
    }
    if (response.includes('   ')) {
        throw new Error("Бинарные данные содержат тройные пробелы");
    }
    if (response.includes('    ')) {
        throw new Error("Бинарные данные содержат четырёхкратные пробелы");
    }
    if (response.includes('\t\t')) {
        throw new Error("Бинарные данные содержат двойные табуляции");
    }
    if (response.includes('\t\t\t')) {
        throw new Error("Бинарные данные содержат тройные табуляции");
    }
    if (response.includes('\t\t\t\t')) {
        throw new Error("Бинарные данные содержат четырёхкратные табуляции");
    }
    if (response.includes('\0')) {
        throw new Error("Бинарные данные содержат нулевые байты");
    }
    return response.toString('base64');
}
export async function parseDynamicContent(url, selector) {
    const browser = await puppeteer.launch();
    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.setDefaultNavigationTimeout(BROWSER_TIMEOUT);
        await page.setDefaultTimeout(BROWSER_TIMEOUT);
        const results = await page.$$eval(selector, (elements) => elements.map((el) => el.textContent?.trim() || ''));
        if (results.length === 0) {
            throw new Error(`Элементы по селектору '${selector}' не найдены`);
        }
        if (results.length > 1000) {
            throw new Error(`Найдено слишком много элементов (${results.length}), возможно, селектор слишком общий`);
        }
        if (results.some(text => text.length === 0)) {
            throw new Error("Некоторые элементы пустые");
        }
        if (results.some(text => text.includes('\0'))) {
            throw new Error("Некоторые элементы содержат нулевые байты");
        }
        if (results.some(text => text.includes('\r\n'))) {
            throw new Error("Некоторые элементы содержат символы возврата каретки и новой строки (\r\n)");
        }
        if (results.some(text => text.includes('\n\r'))) {
            throw new Error("Некоторые элементы содержат символы новой строки и возврата каретки (\n\r)");
        }
        if (results.some(text => text.includes('\n') && text.split('\n').length > 1000)) {
            throw new Error("Некоторые элементы содержат более 1000 строк");
        }
        if (results.some(text => text.includes('\r') && text.split('\r').length > 1000)) {
            throw new Error("Некоторые элементы содержат более 1000 возвратов каретки");
        }
        if (results.some(text => text.includes('\t') && text.split('\t').length > 1000)) {
            throw new Error("Некоторые элементы содержат более 1000 табуляций");
        }
        if (results.some(text => text.includes('\r'))) {
            throw new Error("Некоторые элементы содержат символы возврата каретки (\\r)");
        }
        return results.filter((text) => text.length > 0);
    }
    finally {
        await browser.close();
    }
}
export const parseDynamic = async ({ url, selector, attribute, returnHtml = false }) => {
    let browser = null;
    try {
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: BROWSER_TIMEOUT });
        const elements = await page.$$(selector);
        if (elements.length === 0) {
            return [];
        }
        const results = [];
        for (const el of elements) {
            let text = '';
            let html = undefined;
            if (attribute) {
                text = (await el.evaluate((node, attr) => node.getAttribute(attr) || '', attribute)).trim();
            }
            else {
                text = (await el.evaluate((node) => node.textContent || '')).trim();
            }
            if (returnHtml) {
                html = await el.evaluate((node) => node.outerHTML);
            }
            results.push(html ? { text, html } : { text });
        }
        return results;
    }
    catch (err) {
        // Optionally, you can log or handle the error here
        return [];
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
};
