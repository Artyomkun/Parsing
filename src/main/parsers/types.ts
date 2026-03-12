// src/main/parsers/types.ts

// Базовый интерфейс для конфигурации парсинга
export interface ParseConfig {
  type: string;
  data: string;
}

// Опции для парсинга HTML/Dynamic контента
export interface ParseOptions {
  attribute?: string;
  returnHtml?: boolean;
  timeout?: number;
}

// Результат операции парсинга
export interface ParseResult {
  success: boolean;
  result?: any;
  error?: string;
}

// Типы для работы с элементами
export interface ParsedElement {
  text: string;
  html: string;
  [attr: string]: string | undefined;
}