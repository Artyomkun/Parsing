import { createHash } from 'crypto-browserify';
import { CheerioAPI } from 'cheerio';
import type { Element } from 'domhandler';
import { load } from 'cheerio';
import ini from 'ini';
import yaml from 'js-yaml';
import xml2js from 'xml2js';
import Papa from 'papaparse';

// SHA-256 Hashing Utility
export function sha256(data: string): string {
  const hash = createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

// XML Builder instance (reusable)
const xmlBuilder = new xml2js.Builder({
  renderOpts: { pretty: true, indent: '  ', newline: '\n' },
  headless: true,
  cdata: true
});

// Error messages
const PARSER_ERRORS = {
  INVALID_FORMAT: (type: string) => `Invalid ${type} format`,
  UNSUPPORTED_TYPE: (type: string) => `Unsupported parser type: ${type}`,
  NO_CONTENT: 'No content found',
  CONVERSION_FAILED: (from: string, to: string) => `Conversion from ${from} to ${to} failed`
};

// XML Utilities
const xmlToJson = (data: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(data, { explicitArray: false, trim: true }, (err, result) => {
      err ? reject(new Error(PARSER_ERRORS.INVALID_FORMAT('XML'))) : resolve(result);
    });
  });
};

const jsonToXml = (obj: any): string => {
  return xmlBuilder.buildObject(obj);
};

interface HtmlTagData {
  text: string;
  html: string;
  attrs: Record<string, string>;
}

export type HtmlJson = Record<string, HtmlTagData[]>;

export const HtmlJsonDefault: HtmlJson = {};

// HTML Utilities
export const htmlToJson = (
  dataOr$: string | CheerioAPI,
  options?: { recursive?: boolean; filterTags?: string[] }
): HtmlJson => {
  // Получаем CheerioAPI независимо от того, что передали
  const $: CheerioAPI = typeof dataOr$ === 'string' ? load(dataOr$, { xmlMode: false }) : dataOr$;

  const result: HtmlJson = {};
  const ignored = (options?.filterTags ?? ['script', 'style', 'noscript']).map(t => t.toLowerCase());
  const IGNORED = new Set<string>(ignored);

  const processElement = (element: Element) => {
    if (!element || element.type !== 'tag') return;

    const tagName = (element.tagName ?? '').toLowerCase();
    if (!tagName || IGNORED.has(tagName)) return;

    if (!result[tagName]) result[tagName] = [];

    const attrs = (element.attribs ?? {}) as Record<string, string>;

    result[tagName].push({
      text: $(element).text().trim(),
      html: $(element).html()?.trim() ?? '',
      attrs,
    });

    if (options?.recursive && element.children?.length) {
      for (const child of element.children) {
        if (child.type === 'tag') processElement(child as Element);
      }
    }
  };

  // удобный и типобезопасный обход: toArray() возвращает Element[]
  const elems = $('*').toArray();
  for (const el of elems) processElement(el as Element);

  return result;
};

const jsonToHtml = (json: any): string => {
  if (typeof json !== 'object' || json === null) {
    return String(json);
  }
  
  let html = '';
  for (const [key, value] of Object.entries(json)) {
    if (Array.isArray(value)) {
      value.forEach(item => {
        html += `<${key}>${jsonToHtml(item)}</${key}>`;
      });
    } else if (typeof value === 'object') {
      html += `<${key}>${jsonToHtml(value)}</${key}>`;
    } else {
      html += `<${key}>${String(value)}</${key}>`;
    }
  }
  return html;
};

// Markdown to HTML converter
const markdownToHtml = (markdown: string): string => {
  return markdown
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`{3}([\s\S]*?)`{3}/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/<\/p><p>/g, '</p>\n<p>')
    .replace(/^(?!<h[1-6]|<pre|<p|<ul|<ol|<li|<img|<a)/gm, '<p>$&')
    .replace(/([^\n><]+)(?=\n|$)/g, '$1</p>');
};

// CSV/TSV Utilities
const parseDelimited = (data: string, delimiter: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(data, {
      delimiter,
      header: true,
      skipEmptyLines: true,
      transform: (value) => value.trim(),
      complete: (result) => resolve(result.data),
      error: (error: { message: string | undefined; }) => reject(new Error(error.message))
    });
  });
};

// Hashing Utilities
const hashConverter = async (data: string, algorithm: string = 'sha256'): Promise<string> => {
  if (algorithm === 'sha256') return sha256(data);
  
  // For future hash algorithms
  const hash = createHash(algorithm);
  hash.update(data);
  return hash.digest('hex');
};

// Format Converters
const converters: Record<string, (data: string) => Promise<string>> = {
  // Text-based formats
  html: async (data) => (load(data) as any).text().trim() || PARSER_ERRORS.NO_CONTENT,
  text: async (data) => data.trim() || PARSER_ERRORS.NO_CONTENT,
  markdown: async (data) => markdownToHtml(data) || PARSER_ERRORS.NO_CONTENT,
  
  // JSON-based formats
  json: async (data) => JSON.stringify(JSON.parse(data), null, 2),
  jsonl: async (data) => {
    const jsonObjects = data.split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    return JSON.stringify(jsonObjects, null, 2);
  },
  yaml: async (data) => JSON.stringify(yaml.load(data), null, 2),
  ini: async (data) => JSON.stringify(ini.parse(data), null, 2),
  
  // Delimited formats
  csv: async (data) => JSON.stringify(await parseDelimited(data, ','), null, 2),
  tsv: async (data) => JSON.stringify(await parseDelimited(data, '\t'), null, 2),
  
  // XML formats
  xml: async (data) => {
    try {
      if (typeof DOMParser !== 'undefined') {
        return new XMLSerializer().serializeToString(
          new DOMParser().parseFromString(data, 'application/xml')
        );
      }
      return jsonToXml(await xmlToJson(data));
    } catch {
      return PARSER_ERRORS.NO_CONTENT;
    }
  },
  
  // Conversion formats
  xml2json: async (data) => JSON.stringify(await xmlToJson(data), null, 2),
  html2json: async (data) => JSON.stringify(htmlToJson(load(data)), null, 2),
  json2html: async (data) => jsonToHtml(JSON.parse(data)) || PARSER_ERRORS.NO_CONTENT,
  csv2json: async (data) => JSON.stringify(await parseDelimited(data, ','), null, 2),
  json2csv: async (data) => Papa.unparse(JSON.parse(data)),
  yaml2json: async (data) => JSON.stringify(yaml.load(data), null, 2),
  json2yaml: async (data) => yaml.dump(JSON.parse(data)) || PARSER_ERRORS.NO_CONTENT,
  xml2yaml: async (data) => yaml.dump(await xmlToJson(data)) || PARSER_ERRORS.NO_CONTENT,
  yaml2xml: async (data) => jsonToXml(yaml.load(data) as object),
  json2xml: async (data) => jsonToXml(JSON.parse(data)),
  
  // Specialized formats
  xml2jsonl: async (data) => {
    const json = await xmlToJson(data);
    return Object.entries(json)
      .map(([key, value]) => JSON.stringify({ [key]: value }))
      .join('\n');
  },

  // Hashing operations
  sha256: async (data) => hashConverter(data),
  hash: async (data) => hashConverter(data), // Alias for sha256
};

export const parseData = async (type: string, data: string): Promise<string> => {
  try {
    // Validate input
    if (!data.trim()) return PARSER_ERRORS.NO_CONTENT;
    
    // Get converter
    const converter = converters[type.toLowerCase()];
    if (!converter) throw new Error(PARSER_ERRORS.UNSUPPORTED_TYPE(type));
    
    // Process data
    return await converter(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parsing error';
    throw new Error(`${message} (input type: ${type})`);
  }
};