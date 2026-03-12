import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
// Константы
const MAX_RESPONSE_SIZE = 100 * 1024 * 1024; // 100MB
const BROWSER_TIMEOUT = 30000; // 30 секунд
const MAX_HTML_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_URL_LENGTH = 2048;
const MAX_SELECTOR_LENGTH = 1000;
const log = (msg) => console.log(`[Parser] ${msg}`);
// Проверка селектора
const validateSelector = (selector) => {
    if (!selector || typeof selector !== 'string') {
        throw new Error('Селектор должен быть непустой строкой');
    }
    if (selector.length > MAX_SELECTOR_LENGTH) {
        throw new Error(`Селектор слишком длинный (макс. ${MAX_SELECTOR_LENGTH} символов)`);
    }
    const forbiddenPatterns = [
        /[ >+~[\]:]/,
        /::\w+/
    ];
    for (const pattern of forbiddenPatterns) {
        if (pattern.test(selector)) {
            throw new Error('Селектор содержит запрещенные символы или конструкции');
        }
    }
};
// Проверка URL
const validateUrl = (url) => {
    if (!url || typeof url !== 'string') {
        throw new Error('URL должен быть непустой строкой');
    }
    if (url.length > MAX_URL_LENGTH) {
        throw new Error(`URL слишком длинный (макс. ${MAX_URL_LENGTH} символов)`);
    }
    if (!/^https?:\/\//i.test(url)) {
        throw new Error('URL должен начинаться с http:// или https://');
    }
};
// Парсинг динамического контента
export const parseDynamicContent = async (url, selector, options = {}) => {
    try {
        // Валидация входных данных
        validateUrl(url);
        validateSelector(selector);
        let browser = null;
        try {
            // Запуск браузера
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            page.setDefaultNavigationTimeout(options.timeout || BROWSER_TIMEOUT);
            page.setDefaultTimeout(options.timeout || BROWSER_TIMEOUT);
            // Настройка User-Agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
            // Переход по URL
            log(`Открытие страницы: ${url}`);
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: options.timeout || BROWSER_TIMEOUT
            });
            // Ожидание селектора
            log(`Ожидание селектора: ${selector}`);
            await page.waitForSelector(selector, {
                visible: true,
                timeout: options.timeout || BROWSER_TIMEOUT
            });
            // Извлечение данных
            const results = await page.$$eval(selector, (elements, opts) => {
                const { attribute, returnHtml } = opts;
                return elements.map((el) => {
                    if (attribute) {
                        return el.getAttribute(attribute) || '';
                    }
                    if (returnHtml) {
                        return el.outerHTML;
                    }
                    return el.textContent?.trim() || '';
                });
            }, options);
            // Фильтрация непустых результатов
            const filteredResults = results.filter((item) => item.trim().length > 0);
            if (filteredResults.length === 0) {
                throw new Error('Не найдено данных по указанному селектору');
            }
            return filteredResults;
        }
        finally {
            if (browser)
                await browser.close();
        }
    }
    catch (error) {
        throw new Error(`Ошибка при динамическом парсинге: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
};
// Парсинг статического HTML
export const parseHTMLContent = async (url, selector) => {
    try {
        // Валидация входных данных
        validateUrl(url);
        validateSelector(selector);
        // Запрос контента
        const response = await fetch(url);
        // Проверка ответа
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
        }
        // Проверка типа контента
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) {
            throw new Error('Ответ не является HTML документом');
        }
        // Проверка размера
        const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
        if (contentLength > MAX_HTML_SIZE) {
            throw new Error(`Размер HTML превышает ${MAX_HTML_SIZE / 1024 / 1024}MB`);
        }
        // Получение HTML
        const html = await response.text();
        // Парсинг с помощью Cheerio
        const $ = cheerio.load(html);
        const elements = $(selector);
        if (elements.length === 0) {
            throw new Error('Элементы не найдены');
        }
        // Извлечение текста
        const results = elements
            .map((_, el) => $(el).text().trim())
            .get()
            .filter(text => text.length > 0);
        if (results.length === 0) {
            throw new Error('Найдены элементы, но все они пустые');
        }
        return results;
    }
    catch (error) {
        throw new Error(`Ошибка при парсинге статического HTML: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
};
// Алиас для статического парсинга
export const parseHTML = parseHTMLContent;
