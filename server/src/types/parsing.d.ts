declare namespace Parsing {
  // Конфигурация парсинга данных
  export interface ParseConfig {
    type: 'csv' | 'html' | 'json' | 'xml' | 'text' | 'markdown' | 
            'yaml' | 'ini' | 'tsv' | 'jsonl' | 'xml2json' | 
            'html2json' | 'json2html' | 'csv2json' | 'json2csv' |
            'yaml2json' | 'json2yaml' | 'xml2yaml' | 'yaml2xml' |
            'json2xml' | 'xml2jsonl';
    data: string;
  }

  // Опции для парсинга HTML
  export interface ParseOptions {
    attribute?: string;
    returnHtml?: boolean;
    timeout?: number;
  }

  // Результат парсинга элемента
  export interface ParsedElement {
    text: string;
    html: string;
    [attr: string]: string | undefined;
  }

  // Результат операции парсинга
  export interface ParseResult {
    success: boolean;
    result?: any;
    error?: string;
  }
}

export default Parsing;