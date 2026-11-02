import * as cheerio from 'cheerio';
import Papa, { parse as papaParse } from 'papaparse';

const MAX_HTML_SIZE = 100 * 1024 * 1024;
const MAX_ELEMENTS = 1000;
const MAX_COLUMNS = 100;
const MAX_CELL_SIZE = 1000;

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

const validateInput = (
    input: string | Buffer,
    type: 'string' | 'buffer',
    maxSize: number,
    encoding: BufferEncoding = 'utf-8'
): string => {
    if (type === 'string') {
        if (typeof input !== 'string') {
            throw new ValidationError("Expected string input");
        }
        if (!input) {return '';}
        if (input.length > maxSize) {
            throw new ValidationError(`Data size exceeds ${maxSize / 1_000_000} MB`);
        }
        return input;
    }
        if (!Buffer.isBuffer(input)) {
            throw new ValidationError("Expected Buffer input");
        }
        const content = input.toString(encoding);
        if (!content) { return ''; }
        if (content.length > maxSize) {
            throw new ValidationError(`Data size exceeds ${maxSize / 1_000_000} MB`);
        }
        return content;
    
};

export const validateStringContent = (content: string): string => {
    const forbiddenPatterns: [RegExp, string][] = [
        [/\0/g, "Data contains null bytes"],
        [/[\r\n]+/g, "Data contains illegal new lines"],
        [/.{1001,}/g, "Data contains a line longer than 1000 characters"],
        [/\t/g, "Data contains tabs"],
    ];
    for (const [pattern, message] of forbiddenPatterns) {
        if (pattern.test(content)) {throw new ValidationError(message);}
    }
    return content.trim();
};

const normalizeText = (text: string): string => text.replace(/\s+/g, ' ').trim();

export const parseText = (input: string): string => {
    const content = validateInput(input, 'string', 1_000_000);
    return content ? normalizeText(content) : '';
};

export const parseXml = (input: string): string => {
    const content = validateInput(input, 'string', MAX_HTML_SIZE);
    const $ = cheerio.load(content, { xmlMode: true });
    const root = $('root').first();
    if (!root.length) {throw new ValidationError("XML does not contain root <root> element");}
    const text = root.text().trim();
    if (!text) {throw new ValidationError("Root element <root> is empty");}
    return normalizeText(text);
};

export const parseCsv = (input: string): string[][] => {
    const content = validateInput(input, 'string', MAX_HTML_SIZE);
    const result = papaParse<string[]>(content, {header: false, skipEmptyLines: true, transform: (value: string) => value.trim()});
    if (result.errors.length) {throw new ValidationError(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`);}
    const data: string[][] = result.data as string[][];
    if (data.length > MAX_ELEMENTS) {throw new ValidationError(`CSV contains more than ${MAX_ELEMENTS} rows`);}
    const colCount = data[0]?.length ?? 0;
    if (colCount > MAX_COLUMNS) {throw new ValidationError(`CSV contains more than ${MAX_COLUMNS} columns`);}
    data.forEach(row => {
        if (row.length !== colCount) {throw new ValidationError("Row column count mismatch");}
        row.forEach(cell => {if (cell.length > MAX_CELL_SIZE) {throw new ValidationError(`Cell content exceeds ${MAX_CELL_SIZE} characters`);}});
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
    if (!body.length) {throw new ValidationError("HTML does not contain <body> tag");}
    const text = body.text().trim();
    if (!text) {throw new ValidationError("<body> tag contains no text");}
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

const validateStringInput = (response: string, maxSize = 1_000_000): string => {
    if (typeof response !== 'string') {
        throw new Error('Ожидается строковый формат данных');
    }
    if (response.length > maxSize) {
        throw new Error(`Размер данных превышает ${maxSize / 1_000_000} МБ`);
    }
    if (response.includes('\0')) {
        throw new Error('Данные содержат нулевые байты');
    }
    return response.trim();
};

export function parseTextResponse(response: string) {
    const validated = validateStringInput(response);
    if (!validated) {return '';}
    return validated ? normalizeText(validated) : '';
}

export function parseXmlResponse(response: string) {
    const validated = validateStringInput(response);
    if (!validated) {return '';}
    
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

export function parseCsvResponse(response: string): string[][] {
    const validated = validateStringInput(response);
    if (!validated) {return [];}

    const result = Papa.parse<string[]>(validated, {
        delimiter: ',',
        skipEmptyLines: true,
        dynamicTyping: false,
    });

    if (result.errors.length > 0) {
        throw new Error(`CSV parse error: ${result.errors[0].message}`);
    }

    const rows = result.data;

    if (rows.length > 1000) {
        throw new Error('CSV содержит более 1000 строк');
    }

    return rows;
}

export function parseJsonResponse(response: string) {
    try {
        return JSON.parse(response);
    } catch (error) {
        throw new Error(`Ошибка парсинга JSON: ${(error as Error).message}`, { cause: error });
    }
}

export function parseHtmlResponse(response: string): string {
    const validated = validateStringInput(response);
    if (!validated) {return '';}

    const $ = cheerio.load(validated);
    const text = $('body').text().trim();

    if (!text) {
        throw new Error('HTML: тело пустое');
    }

    return normalizeText(text);
}

export function parseMarkdownResponse(response: string) {
    const validated = validateStringInput(response);
    if (!validated) {return '';}
    return normalizeText(validated).replace(/(#+ )|(\*\*?)|(__?)|(~~)|(`+)/g, ' ');
}

export function parsePlainTextResponse(response: string) {
    return parseTextResponse(response);
}

export function parseBinaryResponse(response: Buffer): string {
    if (!Buffer.isBuffer(response)) {
        throw new Error('Ожидается Buffer');
    }
    if (response.length > 1_000_000) {
        throw new Error('Размер бинарных данных превышает 1 МБ');
    }
    return response.toString('base64');
}