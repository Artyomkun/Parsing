declare global {
  namespace App {
    /**
     * Типы, связанные с парсингом данных
     * @namespace Parsing
     */
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
      interface ColumnDef<T> { /* ... */ }
      interface ButtonProps { /* ... */ }
      interface DataTableProps<T> { /* ... */ }
    }
    
    /**
     * Типы для работы с Electron API
     * @namespace Electron
     */
    namespace Electron {
      interface FileFilter {
        name: string;
        extensions: string[];
      }

      interface FileDialogOptions {
        filters?: FileFilter[];
        properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
      }

      interface IpcApi {
        send(channel: string, ...args: any[]): void;
        invoke<T>(channel: string, ...args: any[]): Promise<T>;
        on(channel: string, listener: (...args: any[]) => void): void;
      }
    }
    
    /**
     * Типы состояния приложения
     * @namespace State
     */
    namespace State {
      interface ParsingState { /* ... */ }
      interface HistoryItem { /* ... */ }
    }
  }
}

export {};