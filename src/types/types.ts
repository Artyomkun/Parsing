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
};