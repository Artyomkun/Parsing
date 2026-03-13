// Файл: src/main.tsx
import { createRoot } from 'react-dom/client';
import App from './index';
import { load } from 'cheerio';
import * as ini from 'ini';
import * as yaml from 'js-yaml';
import * as xml2js from 'xml2js';
import * as Papa from 'papaparse';
import * as React from 'react';

// Реализация функции json2xml
const json2xml = (obj: any): string => {
  const builder = new xml2js.Builder();
  return builder.buildObject(obj);
};

const handleParse = async (config: { type: string; data: string }): Promise<string> => {
  const { type, data } = config;
  
  try {
    switch (type) {
      case 'csv': {
        return new Promise<string>((resolve, reject) => {
          Papa.parse(data, {
            complete: (result) => resolve(JSON.stringify(result.data, null, 2)),
            error: (error: { message: any; }) => reject(error.message),
          });
        });
      }

      case 'html': {
        const $html = load(data);
        const text = $html('body').text().trim();
        return text || 'No content found';
      }

      case 'json': {
        const parsed = JSON.parse(data);
        return JSON.stringify(parsed, null, 2);
      }

      case 'xml': {
        const xmlParser = new DOMParser();
        const xmlDoc = xmlParser.parseFromString(data, 'application/xml');
        const serializer = new XMLSerializer();
        return serializer.serializeToString(xmlDoc) || 'No content found';
      }

      case 'text': {
        return data.trim() || 'No content found';
      }

      case 'markdown': {
        const markdownToHtml = (markdown: string): string => {
          return markdown
            .replace(/# (.+)/g, '<h1>$1</h1>')
            .replace(/## (.+)/g, '<h2>$1</h2>')
            .replace(/### (.+)/g, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
        };
        return markdownToHtml(data) || 'No content found';
      }

      case 'yaml': {
        const parsed = yaml.load(data);
        return JSON.stringify(parsed, null, 2);
      }

      case 'ini': {
        const parsed = ini.parse(data);
        return JSON.stringify(parsed, null, 2);
      }

      case 'tsv': {
        return new Promise<string>((resolve, reject) => {
          Papa.parse(data, {
            delimiter: '\t',
            complete: (result) => resolve(JSON.stringify(result.data, null, 2)),
            error: (error: { message: any; }) => reject(error.message),
          });
        });
      }

      case 'jsonl': {
        const lines = data.split('\n').filter(line => line.trim() !== '');
        const jsonObjects = lines.map(line => JSON.parse(line));
        return JSON.stringify(jsonObjects, null, 2);
      }

      case 'xml2json': {
        return new Promise<string>((resolve, reject) => {
          xml2js.parseString(data, { explicitArray: false }, (err, result) => {
            if (err) return reject('Invalid XML format');
            resolve(JSON.stringify(result, null, 2));
          });
        });
      }

      case 'html2json': {
        const $html = load(data);
        const jsonResult: Record<string, any[]> = {};
        
        $html('*').each((_index, element) => {
          if (element.type === 'tag') {
            const tagName = element.name.toLowerCase();
            if (!jsonResult[tagName]) jsonResult[tagName] = [];
            
            jsonResult[tagName].push({
              text: $html(element).text().trim(),
              html: $html.html(element)?.trim() || '',
            });
          }
        });
        
        return JSON.stringify(jsonResult, null, 2);
      }

      case 'json2html': {
        const jsonToHtml = (json: any): string => {
          if (typeof json !== 'object' || json === null) {
            return String(json);
          }
          
          let html = '';
          for (const key in json) {
            if (json.hasOwnProperty(key)) {
              const value = json[key];
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
          }
          return html;
        };
        
        try {
          const parsedJson = JSON.parse(data);
          return jsonToHtml(parsedJson) || 'No content found';
        } catch (error) {
          throw new Error('Invalid JSON format');
        }
      }

      case 'csv2json': {
        return new Promise<string>((resolve, reject) => {
          Papa.parse(data, {
            header: true,
            complete: (result) => resolve(JSON.stringify(result.data, null, 2)),
            error: (error: { message: any; }) => reject(error.message),
          });
        });
      }

      case 'json2csv': {
        try {
          const parsedJson = JSON.parse(data);
          return Papa.unparse(parsedJson) || 'No content found';
        } catch (error) {
          throw new Error('Invalid JSON format');
        }
      }

      case 'yaml2json': {
        try {
          const parsedYaml = yaml.load(data);
          return JSON.stringify(parsedYaml, null, 2);
        } catch (error: unknown) {
          const errMsg = error instanceof Error ? error.message : String(error);
          throw new Error(`Invalid YAML format: ${errMsg}`);
        }
      }

      case 'json2yaml': {
        const parsedJson = JSON.parse(data);
        return yaml.dump(parsedJson) || 'No content found';
      }

      case 'xml2yaml': {
        return new Promise<string>((resolve, reject) => {
          xml2js.parseString(data, { explicitArray: false }, (err, result) => {
            if (err) return reject('Invalid XML format');
            resolve(yaml.dump(result) || 'No content found');
          });
        });
      }

      case 'yaml2xml': {
        const parsedYaml = yaml.load(data) as object;
        return json2xml(parsedYaml) || 'No content found';
      }

      case 'json2xml': {
        try {
          const parsedJson = JSON.parse(data);
          return json2xml(parsedJson) || 'No content found';
        } catch (error) {
          throw new Error('Invalid JSON format');
        }
      }

      case 'xml2jsonl': {
        return new Promise<string>((resolve, reject) => {
          xml2js.parseString(data, { explicitArray: false }, (err, result) => {
            if (err) return reject('Invalid XML format');
            
            // Исправлено: правильная обработка результата
            const jsonlContent = Object.entries(result)
              .map(([key, value]) => JSON.stringify({ [key]: value }))
              .join('\n');
              
            resolve(jsonlContent || 'No content found');
          });
        });
      }

      default: {
        throw new Error('Unknown parser type');
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred during parsing';
    throw new Error(message);
  }
};

const Root: React.FC = () => (
  <React.Suspense fallback={<div>Loading...</div>}>
    <App onParse={handleParse} loading={false} />
  </React.Suspense>
);

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<Root />);
} else {
  console.error('Root element with ID "root" not found');
}