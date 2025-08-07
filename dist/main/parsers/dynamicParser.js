import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
// Общие константы
const MAX_RESPONSE_SIZE = 100 * 1024 * 1024;
const BROWSER_TIMEOUT = 30000;
const MAX_HTML_SIZE = 100 * 1024 * 1024;
const log = (msg) => console.log(`[Parser] ${msg}`);
export const parseDynamicContent = async (url, selector, options = {}) => {
    let browser = null;
    if (!url || !selector) {
        throw new Error('URL и селектор обязательны для динамического парсинга');
    }
    // Проверка типов
    if (typeof url !== 'string' || typeof selector !== 'string') {
        throw new Error('URL и селектор должны быть строками');
    }
    if (url.length === 0 || selector.length === 0) {
        throw new Error('URL и селектор не могут быть пустыми строками');
    }
    if (url.length > 2048) {
        throw new Error('URL слишком длинный, максимальная длина - 2048 символов');
    }
    if (selector.length > 1000) {
        throw new Error('Селектор слишком длинный, максимальная длина - 1000 символов');
    }
    if (url.length > MAX_RESPONSE_SIZE) {
        throw new Error(`Размер URL превышает ${MAX_RESPONSE_SIZE / 1024 / 1024}MB`);
    }
    if (selector.length > MAX_RESPONSE_SIZE) {
        throw new Error(`Размер селектора превышает ${MAX_RESPONSE_SIZE / 1024 / 1024}MB`);
    }
    if (!/^https?:\/\//.test(url)) {
        throw new Error('URL должен начинаться с http:// или https://');
    }
    if (selector.includes(' ')) {
        throw new Error('Селектор не должен содержать пробелов');
    }
    if (selector.includes('>') || selector.includes('+') || selector.includes('~')) {
        throw new Error('Селектор не должен содержать сложные селекторы');
    }
    if (selector.includes('[') || selector.includes(']')) {
        throw new Error('Селектор не должен содержать атрибутные селекторы');
    }
    if (selector.includes(':')) {
        throw new Error('Селектор не должен содержать псевдоклассы или псевдоэлементы');
    }
    if (selector.includes('::')) {
        throw new Error('Селектор не должен содержать двойные псевдоэлементы');
    }
    if (selector.includes('::before') || selector.includes('::after')) {
        throw new Error('Селектор не должен содержать псевдоэлементы ::before или ::after');
    }
    if (selector.includes('::first-letter') || selector.includes('::first-line')) {
        throw new Error('Селектор не должен содержать псевдоэлементы ::first-letter или ::first-line');
    }
    if (selector.includes('::selection')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::selection');
    }
    if (selector.includes('::placeholder')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::placeholder');
    }
    if (selector.includes('::marker')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::marker');
    }
    if (selector.includes('::backdrop')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::backdrop');
    }
    if (selector.includes('::cue')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::cue');
    }
    if (selector.includes('::part')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::part');
    }
    if (selector.includes('::slotted')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::slotted');
    }
    if (selector.includes('::view-transition')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition');
    }
    if (selector.includes('::view-transition-group')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-group');
    }
    if (selector.includes('::view-transition-image')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-image');
    }
    if (selector.includes('::view-transition-new')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-new');
    }
    if (selector.includes('::view-transition-old')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-old');
    }
    if (selector.includes('::view-transition-start')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-start');
    }
    if (selector.includes('::view-transition-end')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-end');
    }
    if (selector.includes('::view-transition-name')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-name');
    }
    if (selector.includes('::view-transition-duration')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-duration');
    }
    if (selector.includes('::view-transition-timing-function')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-timing-function');
    }
    if (selector.includes('::view-transition-delay')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-delay');
    }
    if (selector.includes('::view-transition-fill')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-fill');
    }
    if (selector.includes('::view-transition-mode')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-mode');
    }
    if (selector.includes('::view-transition-origin')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-origin');
    }
    if (selector.includes('::view-transition-transform')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-transform');
    }
    if (selector.includes('::view-transition-clip-path')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-clip-path');
    }
    if (selector.includes('::view-transition-filter')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-filter');
    }
    if (selector.includes('::view-transition-background')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-background');
    }
    if (selector.includes('::view-transition-color')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-color');
    }
    if (selector.includes('::view-transition-opacity')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-opacity');
    }
    if (selector.includes('::view-transition-visibility')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-visibility');
    }
    if (selector.includes('::view-transition-display')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-display');
    }
    if (selector.includes('::view-transition-position')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-position');
    }
    if (selector.includes('::view-transition-size')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-size');
    }
    if (selector.includes('::view-transition-scroll')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll');
    }
    if (selector.includes('::view-transition-scroll-snap')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap');
    }
    if (selector.includes('::view-transition-scroll-margin')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-margin');
    }
    if (selector.includes('::view-transition-scroll-padding')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-padding');
    }
    if (selector.includes('::view-transition-scroll-snap-type')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-type');
    }
    if (selector.includes('::view-transition-scroll-snap-align')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-align');
    }
    if (selector.includes('::view-transition-scroll-snap-stop')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-stop');
    }
    if (selector.includes('::view-transition-scroll-snap-strictness')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-strictness');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-x')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-x');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-y')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-y');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-z')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-z');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-xy')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-xy');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-xz')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-xz');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-yz')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-yz');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-xyz')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-xyz');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-xyx')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-xyx');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-xzy')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-xzy');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-yxz')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-yxz');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-yzx')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-yzx');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-zxy')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-zxy');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-zxyx')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-zxyx');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-zxzy')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-zxzy');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-zxyz')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-zxyz');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-zxzyx')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-zxzyx');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-zxyzx')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-zxyzx');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-zxyzxy')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-zxyzxy');
    }
    if (selector.includes('::view-transition-scroll-snap-coordinate-zxyzxyz')) {
        throw new Error('Селектор не должен содержать псевдоэлемент ::view-transition-scroll-snap-coordinate-zxyzxyz');
    }
    try {
        browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36');
        page.setDefaultNavigationTimeout(BROWSER_TIMEOUT);
        page.setDefaultTimeout(BROWSER_TIMEOUT);
        log(`Открытие страницы: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        log(`Ожидание селектора: ${selector}`);
        await page.waitForSelector(selector, { visible: true });
        const attribute = options && options.attribute;
        const returnHtml = options && options.returnHtml;
        const evalResults = await page.$$eval(selector, (elements, attr, returnHtml) => elements.map((el) => {
            const text = el.textContent?.trim() || '';
            const html = returnHtml ? el.outerHTML.trim() : '';
            const attrVal = attr ? el.getAttribute(attr) ?? undefined : undefined;
            return {
                text,
                html,
                ...(attr ? { [attr]: attrVal } : {})
            };
        }), attribute, returnHtml);
        // Настройка таймаутов
        page.setDefaultNavigationTimeout(options.timeout || BROWSER_TIMEOUT);
        page.setDefaultTimeout(options.timeout || BROWSER_TIMEOUT);
        const filtered = evalResults.filter((r) => r.text.length > 0 || (attribute && [attribute]));
        if (filtered.length === 0) {
            throw new Error(`Найдено ${evalResults.length}, но все пустые или без атрибута`);
        }
        return filtered.map((item) => item.text);
    }
    catch (error) {
        throw new Error(`Ошибка при динамическом парсинге: ${error.message}`);
    }
    finally {
        if (browser)
            await browser.close();
    }
};
/**
 * Парсинг статического HTML контента
 */
export const parseHTMLContent = async (url, selector) => {
    try {
        const response = await fetch(url);
        // Проверка размера контента
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
            throw new Error(`Размер HTML превышает ${MAX_RESPONSE_SIZE / 1024 / 1024}MB`);
        }
        if (!response.ok) {
            throw new Error(`Ошибка при загрузке страницы: ${response.status} ${response.statusText}`);
        }
        if (!response.headers.get('content-type')?.includes('text/html')) {
            throw new Error('Ответ не является HTML документом');
        }
        if (!response.headers.get('content-length')) {
            throw new Error('Не удалось определить размер HTML документа');
        }
        if (Number(response.headers.get('content-length')) > MAX_RESPONSE_SIZE) {
            throw new Error(`Размер HTML превышает ${MAX_RESPONSE_SIZE / 1024 / 1024} МБ`);
        }
        if (Number(response.headers.get('content-length')) < 1) {
            throw new Error('Размер HTML слишком мал, возможно, это не HTML документ');
        }
        if (Number(response.headers.get('content-length')) > MAX_HTML_SIZE) {
            throw new Error(`Фактический размер HTML > ${MAX_HTML_SIZE} байт`);
        }
        const html = await response.text();
        // Проверка фактического размера
        if (html.length > MAX_RESPONSE_SIZE) {
            throw new Error(`Фактический размер HTML (${html.length} байт) превышает лимит`);
        }
        const $ = cheerio.load(html);
        const elements = $(selector);
        if (!elements || elements.length === 0) {
            throw new Error(`Элементы по селектору "${selector}" не найдены в HTML`);
        }
        if (elements.length > 1000) {
            throw new Error(`Найдено слишком много элементов (${elements.length}), возможно, селектор слишком общий`);
        }
        if (elements.length === 0) {
            throw new Error(`Элементы по селектору "${selector}" не найдены в HTML`);
        }
        // Извлечение текста из элементов
        if (elements.length > 1000) {
            throw new Error(`Найдено слишком много элементов (${elements.length}), возможно, селектор слишком общий`);
        }
        return elements
            .map((_, el) => $(el).text().trim())
            .get()
            .filter(text => text.length > 0);
    }
    catch (error) {
        throw new Error(`Ошибка при парсинге статического HTML: ${error.message}`);
    }
};
export const parseHTML = async (url, selector) => {
    return parseHTMLContent(url, selector);
};
