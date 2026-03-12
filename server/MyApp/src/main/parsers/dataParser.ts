// D:\Parsing-main\server\MyApp\src\main\parsers\dataParser.ts

import { Builder, parseString } from 'xml2js';
import Papa from 'papaparse';
import { parseDocument, DomUtils } from 'htmlparser2';
import type { Element, Node } from 'domhandler';
import { load } from 'cheerio';
import yaml from 'js-yaml';
import ini from 'ini';

/** --- Типы --- */
export interface HtmlTagData {
  text: string;
  html: string;
  attrs: Record<string, string>;
}
export type HtmlJson = Record<string, HtmlTagData[]>;

export type ParseConfig = {
  type: string;
  data: string;
  options?: Record<string, any>;
};

/** --- Парсер на базе htmlparser2 --- */
export const parseHtmlWithHtmlparser2 = (
  html: string,
  options?: { recursive?: boolean; filterTags?: string[] }
): HtmlJson => {
  const doc = parseDocument(html);
  const result: HtmlJson = {};

  const ignored = new Set((options?.filterTags ?? ['script', 'style', 'noscript']).map(t => t.toLowerCase()));

  const walk = (node: Node) => {
    if (!node) return;

    if ((node as Element).type === 'tag') {
      const el = node as Element;
      const tag = (el.tagName ?? '').toLowerCase();
      if (!tag || ignored.has(tag)) {
        if (options?.recursive && el.children) el.children.forEach(walk);
        return;
      }

      const text = DomUtils.getText(el).trim();
      const outerHtml = DomUtils.getOuterHTML(el) ?? '';
      const attrs = (el.attribs ?? {}) as Record<string, string>;

      if (!result[tag]) result[tag] = [];
      result[tag].push({ text, html: outerHtml, attrs });

      if (options?.recursive && el.children) el.children.forEach(walk);
      return;
    }

    // обход детей для прочих узлов (root и т.д.)
    const children = (node as any).children;
    if (Array.isArray(children)) children.forEach((c: Node) => walk(c));
  };

  doc.children.forEach(walk);
  return result;
};

/** --- XML builder --- */
const xmlBuilder = new Builder({
  xmldec: { version: '1.0', encoding: 'UTF-8' },
  renderOpts: { pretty: true, indent: '  ', newline: '\n' },
  headless: true,
  cdata: true
});

/** --- Ошибки и хелперы --- */
const ERROR_MESSAGES = {
  INVALID_FORMAT: (format: string) => `Invalid ${format} format`,
  UNSUPPORTED_TYPE: (type: string) => `Unsupported parser type: ${type}`,
  NO_CONTENT: 'No content found',
  PROCESSING_ERROR: 'Node processing error'
};

const createErrorMessage = (message: string) => new Error(message);

const promisifiedParseString = (xml: string): Promise<any> =>
  new Promise((resolve, reject) => {
    parseString(xml, { explicitArray: false, trim: true }, (err, result) => {
      err ? reject(createErrorMessage(ERROR_MESSAGES.INVALID_FORMAT('XML'))) : resolve(result);
    });
  });

const jsonToXml = (obj: any): string => xmlBuilder.buildObject(obj);

const parseJsonl = (data: string): any[] =>
  data
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        throw createErrorMessage(`${ERROR_MESSAGES.INVALID_FORMAT('JSONL')} in line: ${line}`);
      }
    });

const convertMarkdownToHtml = (markdown: string): string =>
  markdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    .replace(/`{3}([\s\S]*?)`{3}/g, '<pre><code>$1</code></pre>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2">')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/<\/p><p>/g, '</p>\n<p>')
    .replace(/^(?!<h[1-6]|<pre|<p|<ul|<ol|<li|<img|<a)/gm, '<p>$&')
    .replace(/([^\n><]+)(?=\n|$)/g, '$1</p>');

/** --- Handlers --- */
const handlers: Record<string, (data: string) => Promise<string>> = {
  csv: async (data) =>
    new Promise((resolve, reject) => {
      Papa.parse(data, {
        complete: (result) => resolve(JSON.stringify(result.data, null, 2)),
        error: (error: { message: any }) => reject(createErrorMessage(error.message)),
      });
    }),

  json2csv: async (data) => {
    try {
      const parsed = JSON.parse(data);
      return Papa.unparse(parsed);
    } catch {
      throw createErrorMessage(ERROR_MESSAGES.INVALID_FORMAT('JSON'));
    }
  },

  xml2json: async (data) => {
    try {
      const result = await promisifiedParseString(data);
      return JSON.stringify(result, null, 2);
    } catch {
      throw createErrorMessage(ERROR_MESSAGES.INVALID_FORMAT('XML'));
    }
  },

  json2xml: async (data) => {
    try {
      return jsonToXml(JSON.parse(data));
    } catch {
      throw createErrorMessage(ERROR_MESSAGES.INVALID_FORMAT('JSON'));
    }
  },

  xml2yaml: async (data) => {
    try {
      const result = await promisifiedParseString(data);
      return yaml.dump(result);
    } catch {
      throw createErrorMessage(ERROR_MESSAGES.INVALID_FORMAT('XML'));
    }
  },

  yaml: async (data) => {
    try {
      return JSON.stringify(yaml.load(data), null, 2);
    } catch {
      throw createErrorMessage(ERROR_MESSAGES.INVALID_FORMAT('YAML'));
    }
  },

  yaml2json: async (data) => {
    try {
      return JSON.stringify(yaml.load(data), null, 2);
    } catch {
      throw createErrorMessage(ERROR_MESSAGES.INVALID_FORMAT('YAML'));
    }
  },

  json2yaml: async (data) => {
    try {
      return yaml.dump(JSON.parse(data));
    } catch {
      throw createErrorMessage(ERROR_MESSAGES.INVALID_FORMAT('JSON'));
    }
  },

  yaml2xml: async (data) => {
    try {
      return jsonToXml(yaml.load(data));
    } catch {
      throw createErrorMessage(ERROR_MESSAGES.INVALID_FORMAT('YAML'));
    }
  },

  ini: async (data) => {
    try {
      return JSON.stringify(ini.parse(data), null, 2);
    } catch {
      throw createErrorMessage(ERROR_MESSAGES.INVALID_FORMAT('INI'));
    }
  },

  tsv: async (data) =>
    new Promise((resolve, reject) => {
      Papa.parse(data, {
        delimiter: '\t',
        complete: (result) => resolve(JSON.stringify(result.data, null, 2)),
        error: (error: { message: any }) => reject(createErrorMessage(error.message)),
      });
    }),

  jsonl: async (data) => {
    try {
      return JSON.stringify(parseJsonl(data), null, 2);
    } catch (error) {
      throw createErrorMessage(error instanceof Error ? error.message : String(error));
    }
  },

  html: async (data) => {
    const $ = load(data);
    return $.html() || ERROR_MESSAGES.NO_CONTENT;
  },

  // используем htmlparser2-реализацию, принимающую string
  html2json: async (data) => {
    try {
      return JSON.stringify(parseHtmlWithHtmlparser2(data, { recursive: true }), null, 2);
    } catch (err) {
      throw createErrorMessage(err instanceof Error ? err.message : 'HTML -> JSON conversion failed');
    }
  },

  json2html: async (data) => {
    try {
      const obj = JSON.parse(data);
      // Очень простая реализация: если это массив объектов — строим таблицу; иначе JSON -> pre
      if (Array.isArray(obj)) {
        const rows = obj.map((row: any) =>
          `<tr>${Object.values(row).map(v => `<td>${String(v ?? '')}</td>`).join('')}</tr>`
        ).join('');
        const headers = obj.length ? `<thead><tr>${Object.keys(obj[0]).map(h => `<th>${h}</th>`).join('')}</tr></thead>` : '';
        return `<table>${headers}<tbody>${rows}</tbody></table>`;
      }
      return `<pre>${JSON.stringify(obj, null, 2)}</pre>`;
    } catch {
      throw createErrorMessage(ERROR_MESSAGES.INVALID_FORMAT('JSON'));
    }
  },

  markdown: async (data) => convertMarkdownToHtml(data),

  text: async (data) => data.trim(),

  json: async (data) => {
    try {
      return JSON.stringify(JSON.parse(data), null, 2);
    } catch {
      throw createErrorMessage(ERROR_MESSAGES.INVALID_FORMAT('JSON'));
    }
  },

  xml2jsonl: async (data) => {
    try {
      const result = await promisifiedParseString(data);
      return Object.entries(result)
        .map(([key, value]) => JSON.stringify({ [key]: value }))
        .join('\n');
    } catch {
      throw createErrorMessage(ERROR_MESSAGES.INVALID_FORMAT('XML'));
    }
  },

  csv2json: async (data) =>
    new Promise((resolve, reject) => {
      Papa.parse(data, {
        header: true,
        complete: (result) => resolve(JSON.stringify(result.data, null, 2)),
        error: (error: { message: any }) => reject(createErrorMessage(error.message)),
      });
    })
};

/**
 * Handles data parsing and conversion between formats
 * @param config Parsing configuration
 * @returns Parsed result as string
 */
export const handleParse = async (config: ParseConfig): Promise<string> => {
  const { type, data } = config;

  try {
    if (!data || !data.toString().trim()) return ERROR_MESSAGES.NO_CONTENT;

    const handler = handlers[type];
    if (!handler) throw createErrorMessage(ERROR_MESSAGES.UNSUPPORTED_TYPE(type));

    return await handler(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parsing error';
    throw createErrorMessage(`Data processing error (${type}): ${message}`);
  }
};
