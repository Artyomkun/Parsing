import { OpenDialogOptions, SaveDialogOptions } from 'electron';

/**
 * Тип источника данных для парсинга
 */
export type ParseSource = 
  | { type: 'url'; value: string } 
  | { type: 'file'; path: string }
  | { type: 'raw'; content: string };

/**
 * Опции парсинга
 */
export interface ParseOptions {
  encoding?: BufferEncoding;
  selector?: string;
  timeout?: number;
  waitForSelector?: string;
  pagination?: {
    limit: number;
    pattern: string;
  };
  headers?: Record<string, string>;
}

/**
 * Конфигурация для парсера
 */
export interface ParseConfig {
  type: 'html' | 'json' | 'xml' | 'csv' | 'yaml' | 'text';
  source: ParseSource;
  options?: ParseOptions;
}

/**
 * API для работы с парсерами
 */
export type ParserAPI = {
  /**
   * Парсинг статического HTML
   * @param url URL страницы
   * @param selector CSS-селектор для извлечения данных
   */
  parseHtml(url: string, selector: string): Promise<any>;
  
  /**
   * Парсинг динамического контента (SPA)
   * @param url URL страницы
   * @param selector CSS-селектор для извлечения данных
   * @param options Дополнительные опции
   */
  parseDynamic(url: string, selector: string, options?: ParseOptions): Promise<any>;
  
  /**
   * Универсальный метод парсинга
   * @param config Конфигурация парсинга
   */
  parseData(config: ParseConfig): Promise<any>;
  
  /**
   * Подписка на ошибки парсинга
   * @param callback Функция обработки ошибки
   * @returns Функция отписки
   */
  onError(callback: (error: string) => void): () => void;
};

/**
 * Опции диалоговых окон
 */
export type FileDialogOptions = OpenDialogOptions | SaveDialogOptions;

/**
 * Полный API Electron приложения
 */
export type FullElectronAPI = {
  // Системная информация
  platform: string;
  appVersion: string;
  
  // Уведомления
  showMessage(message: string, type?: 'info' | 'warning' | 'error'): void;
  showError(title: string, content: string): void;
  
  // Диалоговые окна
  openFileDialog(options?: OpenDialogOptions): Promise<string[]>;
  openDirectoryDialog(options?: OpenDialogOptions): Promise<string[]>;
  saveFileDialog(options?: SaveDialogOptions): Promise<string | null>;
  
  // Работа с файлами
  readFile(filePath: string, encoding?: BufferEncoding): Promise<string>;
  writeFile(filePath: string, data: string, encoding?: BufferEncoding): Promise<void>;
  
  // Парсинг контента
  parseContent(
    type: 'html' | 'json' | 'xml' | 'csv' | 'yaml' | 'text', 
    source: ParseSource, 
    options?: ParseOptions
  ): Promise<any>;
  
  // Специализированные методы парсинга
  parseHTML(source: ParseSource, selector: string, options?: ParseOptions): Promise<any>;
  parseDynamicHTML(url: string, selector: string, options?: ParseOptions): Promise<any>;
  parseNetworkResource(url: string, type: string, options?: ParseOptions): Promise<any>;
  parseLocalFile(filePath: string, type: string, options?: ParseOptions): Promise<any>;
  
  // Управление приложением
  restartApp(): void;
  openDevTools(options?: { mode: 'right' | 'bottom' | 'undocked' | 'detach' }): void;
  
  // Логирование
  log(level: 'info' | 'warn' | 'error', message: string, metadata?: Record<string, any>): void;
  
  // Расширенное API парсеров
} & ParserAPI;

// Декларация для глобального доступа
declare global {
  interface Window {
    electronAPI: FullElectronAPI;
  }
}