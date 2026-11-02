export type ParserType =
    | 'html2json'
    | 'json2html'
    | 'csv2json'
    | 'json2csv'
    | 'xml2json'
    | 'json2yaml'
    | 'json'
    | 'jsonl2json'
    | 'jsonl2xml'
    | 'json2xml'
    | 'html2text'
    | 'text2html'
    | 'ini2json'
    | 'xml'
    | 'yaml'
    | 'ini'
    | 'srt2json'
    | 'vtt2json'
    | 'ass2json'
    | 'json2srt'
    | 'json2vtt'
    | 'json2ass'
    | 'srt2vtt'
    | 'vtt2srt'
    | 'text2srt'
    | 'text2vtt'
    | 'text2ass'
    | 'json2xlsx'
    | 'xlsx2json'
    | 'csv2xlsx'
    | 'xlsx2csv'
    | 'json2htmltable'
    | 'htmltable2json'
    | 'htmltables2json'
    | 'image2json'
    | 'image2png'
    | 'image2jpeg'
    | 'image2webp'
    | 'image2avif'
    | 'image2gif'
    | 'image2tiff'
    | 'video2json'
    | 'video2frame'
    | 'video2subtitles'
    | 'video2audio'
    | 'audio2mp3'
    | 'audio2wav'
    | 'audio2ogg'
    | 'audio2aac'
    | 'audio2flac'
    | 'audio2json'
    | 'audio2srt'
    | 'audio2vtt'
    | 'pdf2text'
    | 'pdf2json'
    | 'site2json'
    | 'site2tables'
    | 'site2images'
    | 'site2links'
    | 'site2text'
    | 'site2html';

export type ParserFunction = (config: ParserConfig) => Promise<ParserResult>;

export type OptionType = {
    value: string;
    label: string;
};

export type GroupedOptionType = {
    label: string;
    options: OptionType[];
};

export type SelectProps = {
    options: OptionType[] | GroupedOptionType[];
    value?: OptionType | OptionType[] | null;
    onChange?: (value: OptionType | OptionType[] | null) => void;
    isMulti?: boolean;
    isSearchable?: boolean;
    placeholder?: string;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
};

export type SelectValueProps = {
    value: OptionType | OptionType[] | null;
    placeholder?: string;
    isMulti?: boolean;
    renderOption?: (option: OptionType) => React.ReactNode;
};

export type SelectMenuProps = {
    options: OptionType[] | GroupedOptionType[];
    getMenuProps: () => any;
    getItemProps: (options: { item: OptionType; index: number }) => any;
    highlightedIndex: number | null;
    selectedItem: OptionType | OptionType[] | null;
    isOpen: boolean;
};

export type ThemeType = {
    colors: {
        primary: string;
        secondary: string;
        danger: string;
        text: string;
        background: string;
    };
    spacing: {
        small: string;
        medium: string;
        large: string;
    };
};

export declare namespace Parsing {
    export interface ParserAPI {
        parseHtml(url: string, selector: string): Promise<any>;
        parseDynamic(url: string, selector: string, options?: ParseOptions): Promise<any>;
        parseData(config: ParseConfig): Promise<any>;
        onError(callback: (error: string) => void): () => void;
    };
    export interface ParseResponse<T = any> {
        success: boolean;
        data?: T;
        error?: string;
    };
    export interface ParseConfig {
        type: 'csv' | 'html' | 'json' | 'xml' | 'text' | 'markdown' | 'yaml' | 'ini' | 'tsv' | 'jsonl' | 'xml2json' | 'html2json' | 'json2html' | 'csv2json' | 'json2csv' | 'yaml2json' | 'json2yaml' | 'xml2yaml' | 'yaml2xml' | 'json2xml' | 'xml2jsonl'| 'dynamic' | 'htmlContent'
            | 'srt2json' | 'vtt2json' | 'ass2json' | 'json2srt' | 'json2vtt' | 'json2ass' | 'srt2vtt' | 'vtt2srt' | 'text2srt' | 'text2vtt' | 'text2ass'
            | 'json2xlsx' | 'xlsx2json' | 'csv2xlsx' | 'xlsx2csv' | 'json2htmltable' | 'htmltable2json' | 'htmltables2json'
            | 'image2json' | 'image2png' | 'image2jpeg' | 'image2webp' | 'image2avif' | 'image2gif' | 'image2tiff'
            | 'video2json' | 'video2frame' | 'video2subtitles' | 'video2audio'
            | 'audio2mp3' | 'audio2wav' | 'audio2ogg' | 'audio2aac' | 'audio2flac' | 'audio2json' | 'audio2srt' | 'audio2vtt'
            | 'pdf2text' | 'pdf2json'
            | 'site2json' | 'site2tables' | 'site2images' | 'site2links' | 'site2text' | 'site2html';
        data: string;
        url: string;
        selector: string;
        options?: ParseOptions;
    }
    export interface ParseOptions {
        url: string,
        attribute?: string;
        returnHtml?: boolean;
        timeout?: number;
        encoding?: BufferEncoding;
        selector?: string;
        waitForSelector?: string;
        waitForTimeout?: number;
        pagination?: {
            limit: number;
            pattern: string;
        };
        headers?: Record<string, string>;
        proxy?: string;
        cookies?: Array<{ 
            name: string;
            value: string;
            domain: string
        }>;
        includeAttributes?: boolean;
        attribute?: string;
    }
    export interface ParseResult {
        success: boolean;
        result?: any;
        error?: string;
        text: string;
        html?: string
        attributes?: Record<string, string>;
    }
    
    export interface ParserSelectorProps {
        options: ParserSelectorOption[] | ParserSelectorGroupedOption[];
        value?: ParserSelectorOption | ParserSelectorOption[] | null;
        onChange?: (value: ParserSelectorOption | ParserSelectorOption[] | null) => void;
        isMulti?: boolean;
        isSearchable?: boolean;
        placeholder?: string;
        disabled?: boolean;
        loading?: boolean;
        className?: string;
        renderOption?: (option: ParserSelectorOption) => React.ReactNode;
        onSelectParser?: (parser: ParserType) => void;
        selectedParser?: ParserType;
    };

    export interface ParsingResult {
        success: boolean;
        data: any;
        error?: string;
    }

    export interface ParserMap {
        [key in ParserType]: ParserFunction;
    };

    export interface ParserSelectorState {
        selectedParser: ParserType;
        data: string;
        loading: boolean;
        error: string | null;
        result: string | null;
    };

    export interface ParserSelectorOption {
        value: ParserType;
        label: string;
        description?: string;
        icon?: React.ReactNode;
        disabled?: boolean;
        group?: string;
        [key: string]: any; 
    };

    export interface ParserSelectorGroupedOption {
        label: string;
        options: ParserSelectorOption[];
        [key: string]: any; 
    };
    export interface ParseSource { 
        type: 'url' | 'file' | 'raw'; 
        value: string 
    };

    export interface ParserState {
        input: string;
        output: string;
        parserType: Parsing.ParseConfig['type'];
        isLoading: boolean;
        error: string | null;
    }
    export interface HistoryItem {
        id: string;
        timestamp: Date;
        input: string;
        output: string;
        parserType: string;
    }
    export interface RootState {
        parser: ParserState;
        history: HistoryItem[];
        settings: {
            theme: 'light' | 'dark';
            autoSave: boolean;
        };
    }
}