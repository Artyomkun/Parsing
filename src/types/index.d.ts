// src/types/index.d.ts

/**
 * Глобальное пространство имен для типов приложения
 * 
 * Объединяет все кастомные типы проекта под единым неймспейсом App
 * 
 * @example
 * // Использование в коде:
 * const config: App.Parsing.ParserConfig = {...};
 * 
 * @example
 * // Использование в компоненте:
 * function Button(props: App.Components.ButtonProps) {...}
 */

declare global {
  namespace App {
    /**
     * Типы, связанные с парсингом данных
     * @namespace Parsing
     */
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
    namespace Parsing {
      type ParserType = 
        | 'csv'
        | 'html'
        | 'json'
        | 'xml'
        | 'text'
        | 'markdown'
        | 'yaml'
        | 'ini';

      interface ParserConfig {
        type: ParserType;
        data: string;
        options?: Record<string, any>;
      }

      interface ParsingResult {
        success: boolean;
        data: any;
        error?: string;
      }
    }
    
    /**
     * Типы UI-компонентов
     * @namespace Components
     */
    namespace Components {
      /**
       * Конфигурация колонки таблицы
       * @template T - Тип элемента данных
       */
      interface ColumnDef<T> {
        /**
         * Уникальный идентификатор колонки
         */
        id: string;
        
        /**
         * Заголовок колонки
         */
        header: string | React.ReactNode;
        
        /**
         * Функция для рендеринга содержимого ячейки
         * @param rowData - Данные строки
         * @returns React-узел
         */
        cell: (rowData: T) => React.ReactNode;
        
        /**
         * Ключ свойства в объекте данных (альтернатива cell)
         */
        accessorKey?: keyof T;
        
        /**
         * Ширина колонки (px, % или auto)
         */
        width?: number | string;
        
        /**
         * Выравнивание содержимого
         */
        align?: 'left' | 'center' | 'right';
        
        /**
         * Возможность сортировки
         */
        sortable?: boolean;
      }

      /**
       * Свойства кнопки
       */
      interface ButtonProps {
        /**
         * Вариант стиля кнопки
         */
        variant?: 'primary' | 'secondary' | 'outline';
        
        /**
         * Размер кнопки
         */
        size?: 'sm' | 'md' | 'lg';
        
        /**
         * Обработчик клика
         */
        onClick: () => void;
        
        /**
         * Содержимое кнопки
         */
        children: React.ReactNode;
        
        /**
         * Состояние загрузки
         */
        loading?: boolean;
      }

      /**
       * Свойства таблицы данных
       * @template T - Тип элементов данных
       */
      interface DataTableProps<T> {
        /**
         * Массив данных для отображения
         */
        data: T[];
        
        /**
         * Конфигурация колонок
         */
        columns: ColumnDef<T>[];
        
        /**
         * Флаг загрузки данных
         */
        loading?: boolean;
        
        /**
         * Высота таблицы
         */
        height?: number | string;
      }
    }
    
    /**
     * Типы для работы с Electron API
     * @namespace Electron
     */
    namespace Electron {
      /**
       * Интерфейс IPC-коммуникации
       */
      interface IpcApi {
        /**
         * Отправка сообщения
         * @param channel - Канал связи
         * @param args - Аргументы
         */
        send(channel: string, ...args: any[]): void;
        
        /**
         * Вызов метода с ожиданием ответа
         * @param channel - Канал связи
         * @param args - Аргументы
         * @returns Promise с результатом
         */
        invoke<T>(channel: string, ...args: any[]): Promise<T>;
        
        /**
         * Подписка на сообщения
         * @param channel - Канал связи
         * @param listener - Обработчик сообщений
         */
        on(channel: string, listener: (...args: any[]) => void): void;
      }

      /**
       * Опции файлового диалога
       */
      interface FileDialogOptions {
        /**
         * Фильтры файлов
         */
        filters?: Electron.FileFilter[];
        
        /**
         * Свойства диалога
         */
        properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
      }
    }
    
    /**
     * Типы состояния приложения
     * @namespace State
     */
    namespace State {
      /**
       * Состояние парсинга
       */
      interface ParsingState {
        /**
         * Входные данные
         */
        input: string;
        
        /**
         * Результат парсинга
         */
        output: string;
        
        /**
         * Формат данных
         */
        format: Parsing.ParserType;
        
        /**
         * Флаг выполнения операции
         */
        isLoading: boolean;
        
        /**
         * Ошибка парсинга
         */
        error: string | null;
      }

      /**
       * Элемент истории операций
       */
      interface HistoryItem {
        /**
         * Уникальный идентификатор
         */
        id: string;
        
        /**
         * Временная метка операции
         */
        timestamp: Date;
        
        /**
         * Тип входных данных
         */
        inputType: string;
        
        /**
         * Тип выходных данных
         */
        outputType: string;
      }
    }
  }
}

export {};