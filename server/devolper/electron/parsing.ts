import { parse as csvParse } from 'papaparse';
import { parse as iniParse } from 'ini';
import { load as cheerioLoad } from 'cheerio';
import yaml from 'js-yaml';
import xml2js from 'xml2js';
import json2xml from 'json2xml';
import { Parser as CsvParser } from 'json2csv';
import fs from 'fs';
import { Transform, TransformCallback, pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

type ParserType = 
  | 'json'
  | 'yaml'
  | 'json2yaml'
  | 'xml'
  | 'xml2json'
  | 'json2xml'
  | 'csv2json'
  | 'json2csv'
  | 'ini'
  | 'html2text';

// ===== ОСНОВНЫЕ ФУНКЦИИ =====

/**
 * Основная функция парсинга данных (для небольших объемов)
 */
export async function handleParse(type: ParserType, data: string): Promise<string> {
  try {
    switch (type) {
      case 'json': return formatJson(data);
      case 'yaml': return yamlToJson(data);
      case 'json2yaml': return jsonToYaml(data);
      case 'xml': return formatXml(data);
      case 'xml2json': return xmlToJson(data);
      case 'json2xml': return jsonToXml(data);
      case 'csv2json': return csvToJson(data);
      case 'json2csv': return jsonToCsv(data);
      case 'ini': return iniToJson(data);
      case 'html2text': return htmlToText(data);
      default: throw new Error(`Unknown parser type: ${type}`);
    }
  } catch (error) {
    throw handleParserError(error, type);
  }
}

/**
 * Обработка больших файлов с поддержкой потоковой обработки
 */
export async function handleLargeFileParse(
  type: ParserType, 
  filePath: string,
  outputPath?: string
): Promise<string | void> {
  try {
    // Для поддерживаемых потоковых форматов
    if (['csv2json', 'json2csv', 'xml2json', 'json2xml', 'json'].includes(type)) {
      if (!outputPath) {
        throw new Error('Output path required for streaming conversion');
      }
      
      await streamParse(type, filePath, outputPath);
      return `File converted and saved to: ${outputPath}`;
    }

    // Для остальных типов используем стандартную обработку
    const data = await fs.promises.readFile(filePath, 'utf-8');
    const result = await handleParse(type, data);

    if (outputPath) {
      await fs.promises.writeFile(outputPath, result);
      return `File saved to: ${outputPath}`;
    }

    return result;
  } catch (error) {
    throw handleParserError(error, type);
  }
}

// ===== ПОТОКОВАЯ ОБРАБОТКА =====

/**
 * Создает поток преобразователя для указанного типа парсера
 */
export function createParseStream(type: ParserType): Transform {
  switch (type) {
    case 'csv2json': return createCsvToJsonStream();
    case 'json2csv': return createJsonToCsvStream();
    case 'xml2json': return createXmlToJsonStream();
    case 'json2xml': return createJsonToXmlStream();
    case 'json': return createJsonFormatterStream();
    default:
      throw new Error(`Streaming not supported for type: ${type}`);
  }
}

/**
 * Полный потоковый конвейер преобразования
 */
export async function streamParse(
  type: ParserType,
  inputPath: string,
  outputPath: string
): Promise<void> {
  const inputStream = fs.createReadStream(inputPath, 'utf-8');
  const outputStream = fs.createWriteStream(outputPath, 'utf-8');
  const transformStream = createParseStream(type);

  await pipelineAsync(
    inputStream,
    transformStream,
    outputStream
  );
}

// ===== РЕАЛИЗАЦИЯ ПОТОКОВЫХ ПРЕОБРАЗОВАТЕЛЕЙ =====

function createCsvToJsonStream(): Transform {
  let headers: string[] | null = null;
  let firstChunk = true;
  
  return new Transform({
    writableObjectMode: false,
    readableObjectMode: false,
    
    transform(chunk, encoding, callback) {
      // помечаем encoding как использованный
      void encoding;

      try {
        const data = chunk.toString();
        const result = csvParse(data, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          preview: 0
        });

        if (!headers) {
          headers = result.meta.fields || [];
        }

        let output = '';
        if (firstChunk) {
          output = '[\n';
          firstChunk = false;
        } else {
          output = ',\n';
        }

        output += result.data
          .map((item: any) => JSON.stringify(item))
          .join(',\n');

        this.push(output);
        callback();
      } catch (error) {
        callback(handleParserError(error, 'csv2json'));
      }
    },
    
    flush(callback) {
      if (firstChunk) {
        this.push('[]');
      } else {
        this.push('\n]');
      }
      callback();
    }
  });
}

function createJsonToCsvStream(): Transform {
  const parser = new CsvParser();
  let headersWritten = false;
  
  return new Transform({
    writableObjectMode: true,
    readableObjectMode: false,
    
    transform(chunk, encoding, callback) {
      // используем encoding как прочитанный
      void encoding;

      try {
        let data = chunk;
        
        if (typeof chunk === 'string') {
          try {
            data = JSON.parse(chunk);
          } catch {
            return callback(new Error('Invalid JSON input'));
          }
        }
        
        if (!Array.isArray(data)) {
          data = [data];
        }
        
        let csv = '';
        if (!headersWritten) {
          csv = parser.parse(data);
          headersWritten = true;
        } else {
          csv = data.map((item: { [s: string]: unknown; } | ArrayLike<unknown>) => 
            Object.values(item).map(val => 
              typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
            ).join(',')
          ).join('\n');
        }
        
        this.push((headersWritten ? '\n' : '') + csv);
        callback();
      } catch (error) {
        callback(handleParserError(error, 'json2csv'));
      }
    }
  });
}

function createXmlToJsonStream(): Transform {
  const parser = new xml2js.Parser({
    explicitArray: false,
    explicitRoot: false,
    mergeAttrs: true,
    charkey: 'value'
  });
  
  let buffer = '';
  
  return new Transform({
    writableObjectMode: false,
    readableObjectMode: false,
    
    transform(chunk, encoding, callback) {
      void encoding;
      try {
        buffer += chunk.toString();
        callback();
      } catch (error) {
        callback(handleParserError(error, 'xml2json'));
      }
    },
    
    async flush(callback) {
      try {
        if (!buffer.trim()) {
          this.push('null');
          return callback();
        }
        
        const result = await parser.parseStringPromise(buffer);
        this.push(JSON.stringify(result, null, 2));
        callback();
      } catch (error) {
        callback(handleParserError(error, 'xml2json'));
      }
    }
  });
}

function createJsonToXmlStream(): Transform {
  let buffer = '';
  
  return new Transform({
    writableObjectMode: false,
    readableObjectMode: false,
    
    transform(chunk, encoding, callback) {
      void encoding;
      try {
        buffer += chunk.toString();
        callback();
      } catch (error) {
        callback(handleParserError(error, 'json2xml'));
      }
    },
    
    flush(callback) {
      try {
        if (!buffer.trim()) {
          this.push('');
          return callback();
        }
        
        const jsonObj = JSON.parse(buffer);
        const xml = json2xml(jsonObj, {
          attributes_key: '_attributes',
          header: true
        });
        
        this.push(xml);
        callback();
      } catch (error) {
        callback(handleParserError(error, 'json2xml'));
      }
    }
  });
}

function createJsonFormatterStream(): Transform {
  let buffer = '';

  return new Transform({
    writableObjectMode: false,
    readableObjectMode: false,

    transform(chunk: Buffer | string, encoding: BufferEncoding, callback: TransformCallback) {
      void encoding;
      try {
        buffer += chunk.toString();
        callback();
      } catch (error) {
        callback(handleParserError(error, 'json'));
      }
    },

    flush(callback: TransformCallback) {
      try {
        const trimmed = buffer.trim();
        
        if (!trimmed) {
          this.push('{}');
          return callback();
        }

        const data = JSON.parse(trimmed);
        this.push(JSON.stringify(data, null, 2));
        callback();
      } catch (error) {
        callback(handleParserError(error, 'json'));
      }
    }
  });
}

// ===== ПАРСЕРЫ ДЛЯ МАЛЕНЬКИХ ФАЙЛОВ =====

function formatJson(data: string): string {
  const parsed = JSON.parse(data);
  return JSON.stringify(parsed, null, 2);
}

function yamlToJson(data: string): string {
  const parsed = yaml.load(data);
  return JSON.stringify(parsed, null, 2);
}

function jsonToYaml(data: string): string {
  const jsonObj = JSON.parse(data);
  return yaml.dump(jsonObj);
}

async function formatXml(data: string): Promise<string> {
  const parser = new xml2js.Parser();
  const builder = new xml2js.Builder({
    renderOpts: { pretty: true, indent: '  ', newline: '\n' }
  });
  const parsed = await parser.parseStringPromise(data);
  return builder.buildObject(parsed);
}

async function xmlToJson(data: string): Promise<string> {
  const parser = new xml2js.Parser({ 
    explicitArray: false,
    explicitRoot: false,
    mergeAttrs: true,
    attrValueProcessors: [xml2js.processors.parseNumbers],
    valueProcessors: [xml2js.processors.parseNumbers]
  });
  const parsed = await parser.parseStringPromise(data);
  return JSON.stringify(parsed, null, 2);
}

function jsonToXml(data: string): string {
  const jsonObj = JSON.parse(data);
  return json2xml(jsonObj, {
    attributes_key: '_attributes',
    header: true
  });
}

function csvToJson(data: string): Promise<string> {
  return new Promise((resolve, reject) => {
    csvParse(data, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (result: { data: any; }) => {
        resolve(JSON.stringify(result.data, null, 2));
      },
      error: (error: { message: any; }) => {
        reject(new Error(`CSV parse error: ${error.message}`));
      }
    });
  });
}

function jsonToCsv(data: string): string {
  const jsonObj = JSON.parse(data);
  if (!Array.isArray(jsonObj)) {
    throw new Error('For CSV conversion, JSON must be an array of objects');
  }
  const parser = new CsvParser();
  return parser.parse(jsonObj);
}

function iniToJson(data: string): string {
  const parsed = iniParse(data);
  return JSON.stringify(parsed, null, 2);
}

function htmlToText(data: string): string {
  const $ = cheerioLoad(data);
  return $('body').text().trim();
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

/**
 * Обработка и форматирование ошибок парсеров
 */
function handleParserError(error: unknown, type: ParserType): Error {
  let errorMessage = 'Parsing error';
  
  if (error instanceof Error) {
    errorMessage += `: ${error.message}`;
  } else if (typeof error === 'string') {
    errorMessage += `: ${error}`;
  }
  
  // Контекстные подсказки
  switch (type) {
    case 'json': errorMessage += '\n• Ensure valid JSON format'; break;
    case 'xml': errorMessage += '\n• Check XML structure and closing tags'; break;
    case 'xml2json': errorMessage += '\n• Verify XML is well-formed'; break;
    case 'csv2json': errorMessage += '\n• Check CSV headers and consistent columns'; break;
    case 'yaml': errorMessage += '\n• Verify YAML indentation and syntax'; break;
    case 'json2yaml': errorMessage += '\n• Input must be valid JSON'; break;
    case 'ini': errorMessage += '\n• INI files should use [sections] and key=value pairs'; break;
    case 'html2text': errorMessage += '\n• Input must be valid HTML'; break;
    case 'json2csv': errorMessage += '\n• Input must be a JSON array of objects'; break;
    case 'json2xml': errorMessage += '\n• Input must be a valid JSON object'; break;
  }
  
  return new Error(errorMessage);
}

/**
 * Определение формата данных
 */
export function detectFormat(data: string): ParserType | null {
  const first100 = data.trim().substring(0, 100);

  // Проверка JSON
  try {
    JSON.parse(first100 + (first100.includes(']') ? ']' : '}'));
    return 'json';
  } catch {}

  // Проверка XML
  if (/^<([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?>/.test(first100)) {
    return 'xml';
  }

  // Проверка YAML
  if (/^([a-zA-Z]+\s*:\s*[^\n]+\n?)+/.test(first100)) {
    return 'yaml';
  }

  // Проверка CSV
  if (/,/.test(first100) && /\n/.test(first100)) {
    return 'csv2json';
  }

  // Проверка INI
  if (/^\[[^\]]+\]/.test(first100)) {
    return 'ini';
  }

  // Проверка HTML
  if (/<html|<!DOCTYPE html|<head|<body/i.test(first100)) {
    return 'html2text';
  }

  return null;
}

/**
 * Возвращает фильтры файлов для диалогов выбора
 */
export function getFileFilters(type: ParserType): Electron.FileFilter[] {
  const filters: Record<string, Electron.FileFilter> = {
    json: { name: 'JSON Files', extensions: ['json'] },
    yaml: { name: 'YAML Files', extensions: ['yaml', 'yml'] },
    xml: { name: 'XML Files', extensions: ['xml'] },
    csv: { name: 'CSV Files', extensions: ['csv'] },
    ini: { name: 'INI Files', extensions: ['ini', 'cfg'] },
    html: { name: 'HTML Files', extensions: ['html', 'htm'] }
  };

  switch (type) {
    case 'json':
    case 'json2yaml':
    case 'json2xml':
    case 'json2csv':
      return [filters.json];
    
    case 'yaml':
      return [filters.yaml];
    
    case 'xml':
    case 'xml2json':
      return [filters.xml];
    
    case 'csv2json':
      return [filters.csv];
    
    case 'ini':
      return [filters.ini];
    
    case 'html2text':
      return [filters.html];
    
    default:
      return [
        filters.json,
        filters.yaml,
        filters.xml,
        filters.csv,
        filters.ini,
        filters.html,
        { name: 'All Files', extensions: ['*'] }
      ];
  }
}