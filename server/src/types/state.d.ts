import Parsing from "./parsing";

declare namespace AppState {
  // Состояние парсера
  export interface ParserState {
    input: string;
    output: string;
    parserType: Parsing.ParseConfig['type'];
    isLoading: boolean;
    error: string | null;
  }

  // Состояние истории
  export interface HistoryItem {
    id: string;
    timestamp: Date;
    input: string;
    output: string;
    parserType: string;
  }

  // Глобальное состояние приложения
  export interface RootState {
    parser: ParserState;
    history: HistoryItem[];
    settings: {
      theme: 'light' | 'dark';
      autoSave: boolean;
    };
  }
}

export default AppState;