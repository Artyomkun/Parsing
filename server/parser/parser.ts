import { load, CheerioAPI } from 'cheerio';
import MarkdownIt from 'markdown-it';
import escapeHtml from 'escape-html';
import Papa from 'papaparse';
import xml2js from 'xml2js';

const xmlBuilder = new xml2js.Builder({
    renderOpts: {
        pretty: true,
        indent: '  ',
        newline: '\n'
    },
    headless: true,
    cdata: true
});

export const PARSER_ERRORS = {
    INVALID_FORMAT: (type: string) => `Invalid ${type} format`,
    UNSUPPORTED_TYPE: (type: string) => `Unsupported parser type: ${type}`,
    NO_CONTENT: 'No content found',
    INVALID_YAML: 'Invalid YAML content',
    CONVERSION_FAILED: (from: string, to: string) => `Conversion from ${from} to ${to} failed`
};

export const xmlToJson = (data: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        xml2js.parseString(data, { explicitArray: false, trim: true }, (err, result) => {
            err ? reject(new Error(PARSER_ERRORS.INVALID_FORMAT('XML'))) : resolve(result);
        });
    });
};

export const jsonToXml = (obj: any): string => {
    return xmlBuilder.buildObject(obj);
};

interface HtmlTagData {
    text: string;
    html: string;
    attrs: Record<string, string>;
}

export type HtmlJson = Record<string, HtmlTagData[]>;
export const HtmlJsonDefault: HtmlJson = {};
const DEFAULT_IGNORED = new Set(['script', 'style', 'noscript']);

type Element = {
    type: 'tag';
    tagName?: string;
    attribs?: Record<string, string>;
    children?: Node[];
};

type Node = Element | { type: 'text' | 'comment' | 'cdata' | 'directive' | 'script' | 'style'; children?: Node[] };

const isTag = (node: Node): node is Element => node.type === 'tag';

export const htmlToJson = (
    dataOr$: string | CheerioAPI,
    options?: { recursive?: boolean; filterTags?: string[] },
): HtmlJson => {
    const $ = typeof dataOr$ === 'string' ? load(dataOr$, { xmlMode: false }) : dataOr$;
    const ignored = new Set(
        (options?.filterTags ?? [...DEFAULT_IGNORED]).map(t => t.toLowerCase()),
    );

    const result: HtmlJson = {};

    const visit = (element: Element): void => {
        const tagName = (element.tagName ?? '').toLowerCase();
        if (!tagName || ignored.has(tagName)) {return;}

        result[tagName] ??= [];
        result[tagName].push({
            text: $(element as any).text().trim(),
            html: $(element as any).html()?.trim() ?? '',
            attrs: { ...element.attribs },
        });

        if (options?.recursive) {
            for (const child of element.children ?? []) {
                if (isTag(child)) {visit(child);}
            }
        }
    };

    for (const el of $('*').toArray()) {
        const node = el as Node;
        if (isTag(node)) {visit(node);}
    }

    return result;
};

const stringifyPrimitive = (value: unknown): string => {
    switch (typeof value) {
        case 'string':
            return value;
        case 'number':
        case 'boolean':
        case 'bigint':
        case 'symbol':
        case 'function':
            return String(value);
        default:
            return '';
    }
};

export const jsonToHtml = (json: unknown): string => {
    if (json === null || json === undefined) {return '';}
    if (typeof json !== 'object') {return escapeHtml(stringifyPrimitive(json));}

    let html = '';
    for (const [key, value] of Object.entries(json)) {
        if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(key)) {
            html += escapeHtml(String(value));
            continue;
        }
        const children = Array.isArray(value) ? value : [value];
        for (const item of children) {
            html += `<${key}>${jsonToHtml(item)}</${key}>`;
        }
    }
    return html;
};

const md = new MarkdownIt({html: false, linkify: true, breaks: false, typographer: false});
export const markdownToHtml = (markdown: string): string => md.render(markdown).trim();

export const parseDelimited = <T = Record<string, string>>(data: string, delimiter: string): Promise<T[]> =>
    new Promise((resolve, reject) => {
        try {
            Papa.parse<T>(data, {
                delimiter,
                header: true,
                skipEmptyLines: true,
                transform: (value) => (typeof value === 'string' ? value.trim() : value),
                complete: (result) => resolve(result.data),
                error: (error: Error) => reject(error),
            });
        } catch (err) {
            reject(err instanceof Error ? err : new Error(String(err)));
        }
    }
);