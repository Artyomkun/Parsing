
import * as xml2js from 'xml2js';
import json2xml from 'json2xml';
import * as Papa from 'papaparse';
import { ParseConfig } from './types.js';

/**
 * Обрабатывает различные форматы данных и преобразует их между форматами
 * @param config Конфигурация парсинга
 * @returns Результат в виде строки
 */
export const handleParse = async (config: ParseConfig): Promise<string> => {
  const { type, data } = config;
  
  try {
    switch (type) {
      case 'csv': 
        // Парсинг CSV в JSON
        return new Promise<string>((resolve, reject) => {
          Papa.parse(data, {
            complete: (result: { data: any; }) => resolve(JSON.stringify(result.data, null, 2)),
            error: (error: { message: any; }) => reject(error.message),
          });
        });

      case 'json2csv': {
        try {
          const parsedJson = JSON.parse(data);
          return Papa.unparse(parsedJson);
        } catch (error) {
          throw new Error('Invalid JSON format');
        }
      }
      case 'xml2json': 
        // Конвертация XML в JSON
        return new Promise<string>((resolve, reject) => {
          xml2js.parseString(data, { explicitArray: false }, (err: any, result: any) => {
            if (err) reject('Неверный формат XML');
            else resolve(JSON.stringify(result, null, 2));
          });
        });

      case 'json2xml': 
        // Конвертация JSON в XML
        return json2xml(JSON.parse(data));

      case 'yaml': 
      case 'yaml2json':
        try {
          const yaml = await import('js-yaml');
          const parsed = yaml.load(data);
          return Promise.resolve(JSON.stringify(parsed, null, 2));
        } catch (error) {
          return Promise.reject('Invalid YAML format');
        }


      case 'json2yaml':
        try {
          const yaml = await import('js-yaml');
          const parsedJson = JSON.parse(data);
          const yamlContent = yaml.dump(parsedJson);
          return Promise.resolve(yamlContent || 'No content found');
        } catch (error) {
          return Promise.reject('Invalid JSON format');
        }
      ;

      case 'ini':
        try {
          const ini = await import('ini');
          const parsed = ini.parse(data);
          return Promise.resolve(JSON.stringify(parsed, null, 2));
        } catch (error) {
          return Promise.reject('Invalid INI format');
        }

      case 'tsv': 
        // Парсинг TSV в JSON
        return new Promise<string>((resolve, reject) => {
          Papa.parse(data, {
            delimiter: '\t',
            complete: (result: { data: any; }) => resolve(JSON.stringify(result.data, null, 2)),
            error: (error: { message: any; }) => reject(error.message),
          });
        });

      case 'jsonl': 
        // Парсинг JSONL в JSON
        const lines = data.split('\n').filter((line: string) => line.trim() !== '');
        const jsonObjects = lines.map((line: string) => JSON.parse(line));
        return JSON.stringify(jsonObjects, null, 2);

      case 'html2json': 
        // Конвертация HTML в JSON (упрощенная)
        return JSON.stringify({ html: data }, null, 2);

      case 'json2html': 
        // Конвертация JSON в HTML (упрощенная)
        return `<div>${JSON.stringify(JSON.parse(data))}</div>`;

      case 'xml': 
        // Обработка XML (возвращаем как есть)
        return data;

      case 'text': 
        // Обработка текста
        return data.trim();

      case 'markdown': 
        // Упрощенная конвертация Markdown в HTML
        return data
          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\n/g, '<br>');

      default: 
        throw new Error(`Неподдерживаемый тип парсера: ${type}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    throw new Error(`Ошибка при обработке данных: ${errorMessage}`);
  }
};