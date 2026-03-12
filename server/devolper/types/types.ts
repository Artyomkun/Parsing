declare global {
  namespace App {
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
    
    namespace Parsing {

      interface ParserConfig {
        type: ParserType;
        data: string;
      }

      interface ParserOptions {
        delimiter?: string;
        filePath?: string;
        encoding?: string;
      }

      interface ParsingResult {
        success: boolean;
        data: any;
        error?: string;
      }
    }
    
    namespace Components {
      interface ColumnDef<T> {
        id: string;
        header: string | React.ReactNode;
        cell: (rowData: T) => React.ReactNode;
        accessorKey?: keyof T;
        width?: number | string;
        align?: 'left' | 'center' | 'right';
        sortable?: boolean;
      }

      interface ButtonProps {
        variant?: 'primary' | 'secondary' | 'outline';
        size?: 'sm' | 'md' | 'lg';
        onClick: () => void;
        children: React.ReactNode;
        loading?: boolean;
        disabled?: boolean;
      }

      interface DataTableProps<T> {
        data: T[];
        columns: ColumnDef<T>[];
        loading?: boolean;
        height?: number | string;
      }
    }
    
    namespace State {
      interface ParsingState {
        input: string;
        output: string;
        format: Parsing.ParserType;
        isLoading: boolean;
        error: string | null;
      }

      interface HistoryItem {
        id: string;
        timestamp: Date;
        inputType: string;
        outputType: string;
      }
    }
  }
}

export {};