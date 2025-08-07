import { parse as csvParse } from 'papaparse';
import { parse as iniParse } from 'ini';
import { load as cheerioLoad } from 'cheerio';
import * as yaml from 'js-yaml';
import * as xml2js from 'xml2js';
import json2xml from 'json2xml';
import { parse as json2csv } from 'json2csv';

namespace Electron {
  /**
   * Фильтр файлов для диалоговых окон
   */
  interface FileFilter {
    /**
     * Название фильтра
     */
    name: string;
    
    /**
     * Расширения файлов (без точки)
     * @example ['jpg', 'png']
     */
    extensions: string[];
  }

  /**
   * Опции файлового диалога
   */
  interface FileDialogOptions {
    /**
     * Фильтры файлов
     */
    filters?: FileFilter[];
    
    /**
     * Свойства диалога
     */
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
  }
}

export async function handleParse(type: string, data: string): Promise<string> {
  switch (type) {
    case 'json':
      return JSON.stringify(JSON.parse(data), null, 2);

    case 'yaml':
      return JSON.stringify(yaml.load(data), null, 2);

    case 'json2yaml':
      return yaml.dump(JSON.parse(data));

    case 'xml':
      return new XMLSerializer().serializeToString(
        new DOMParser().parseFromString(data, 'application/xml')
      );

    case 'xml2json':
      return new Promise((resolve, reject) => {
        xml2js.parseString(data, { explicitArray: false }, (err, result) => {
          if (err) return reject('Invalid XML');
          resolve(JSON.stringify(result, null, 2));
        });
      });

    case 'json2xml':
      return json2xml(JSON.parse(data));

    case 'csv2json':
      return new Promise((resolve, reject) => {
        csvParse(data, {
          header: true,
          complete: (result) => resolve(JSON.stringify(result.data, null, 2)),
          error: (error) => reject(error.message),
        });
      });

    case 'json2csv':
      return json2csv(JSON.parse(data));

    case 'ini':
      return JSON.stringify(iniParse(data), null, 2);

    case 'html2text': {
      const $ = cheerioLoad(data);
      return $('body').text().trim();
    }

    default:
      throw new Error('Unknown parser type: ' + type);
  }
}
