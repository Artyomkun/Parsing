export type OptionType = {
  value: string;
  label: string;
};

// For grouped options
export type GroupedOptionType = {
  label: string;
  options: OptionType[];
};

// Props for Select component
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

// Props for SelectValue component
export type SelectValueProps = {
  value: OptionType | OptionType[] | null;
  placeholder?: string;
  isMulti?: boolean;
  renderOption?: (option: OptionType) => React.ReactNode;
};

// Props for SelectMenu component
export type SelectMenuProps = {
  options: OptionType[] | GroupedOptionType[];
  getMenuProps: () => any;
  getItemProps: (options: { item: OptionType; index: number }) => any;
  highlightedIndex: number | null;
  selectedItem: OptionType | OptionType[] | null;
  isOpen: boolean;
};

// Theme types
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

// Пример определения типа
export type SomeOptionType = {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string; // Для группировки опций
  [key: string]: any; // Дополнительные атрибуты
};
export type SomeGroupedOptionType = {
  label: string;
  options: SomeOptionType[];
  [key: string]: any; // Дополнительные атрибуты
};
export type ParsedElement = {
  text: string;
  html: string;
  [attr: string]: string | undefined;
};
export type ParseOptions = {
  url: string;
  selector: string;
  dynamic?: boolean;
  attribute?: string;
  returnHtml?: boolean;
};
export type ParserType = 'html2json' | 'json2html' | 'csv2json' | 'json2csv' | 'xml2json' | 'jsonl2json' | 'jsonl2xml' | 'json2xml' | 'html2text' | 'text2html';
export type ParserConfig = {
  type: ParserType;
  data: string;
  options?: ParseOptions;
};
export type ParserResult = {
  success: boolean;
  data?: string;
  error?: string;
};
export type ParserFunction = (config: ParserConfig) => Promise<ParserResult>;
export type ParserMap = {
  [key in ParserType]: ParserFunction;
};
export type ParserSelectorState = {
  selectedParser: ParserType;
  data: string;
  loading: boolean;
  error: string | null;
  result: string | null;
};
export type ParserSelectorOption = {
  value: ParserType;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  group?: string; // Для группировки опций
  [key: string]: any; // Дополнительные атрибуты
};
export type ParserSelectorGroupedOption = {
  label: string;
  options: ParserSelectorOption[];
  [key: string]: any; // Дополнительные атрибуты
};
export type ParserSelectorProps = {
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