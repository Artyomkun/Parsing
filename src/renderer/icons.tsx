import * as React from "react";

// Добавляем поддержку свойства size
type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
};

// Обновляем ВСЕ иконки с поддержкой size
export const PlusIcon = (props: IconProps) => {
  const { size, width, height, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? size ?? 16}
      height={height ?? size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
};

// Аналогичное обновление для ВСЕХ иконок
export const MinusIcon = (props: IconProps) => {
  const { size, width, height, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? size ?? 16}
      height={height ?? size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
};

export const ChevronDownIcon = (props: IconProps) => {
  const { size, width, height, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? size ?? 16}
      height={height ?? size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
};

export const ChevronRightIcon = (props: IconProps) => {
  const { size, width, height, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? size ?? 16}
      height={height ?? size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
};

export const DownloadIcon = (props: IconProps) => {
  const { size, width, height, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? size ?? 16}
      height={height ?? size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
};

export const SettingsIcon = (props: IconProps) => {
  const { size, width, height, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? size ?? 16}
      height={height ?? size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
};

export const HomeIcon = (props: IconProps) => {
  const { size, width, height, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? size ?? 16}
      height={height ?? size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
};

export const HistoryIcon = (props: IconProps) => {
  const { size, width, height, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? size ?? 16}
      height={height ?? size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
};

// Исправляем CodeIcon (добавляем обработку size)
export const CodeIcon = (props: IconProps) => {
  const { size, width, height, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? size ?? 16}
      height={height ?? size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
};

export const DatabaseIcon = (props: IconProps) => {
  const { size, width, height, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? size ?? 16}
      height={height ?? size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
};

export const GlobeIcon = (props: IconProps) => {
  const { size, width, height, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? size ?? 16}
      height={height ?? size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
};

export const Code2Icon = (props: IconProps) => {
  const { size, width, height, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? size ?? 16}
      height={height ?? size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M18 16.98h-5.99c-1.1 0-1.95.9-1.95 2s.85 1.98 1.95 1.98H18c1.1 0 2-.9 2-2s-.9-2-2-2z" />
      <path d="M18 6H6c-1.1 0-2 .9-2 2s.9 2 2 2h12c1.1 0 2-.9 2-2s-.9-2-2-2z" />
    </svg>
  );
};

// Экспорт всех иконок через объект для удобства
export const Icons = {
  download: DownloadIcon,
  settings: SettingsIcon,
  home: HomeIcon,
  history: HistoryIcon,
  code: CodeIcon, 
  database: DatabaseIcon,
  globe: GlobeIcon,
  plus: PlusIcon,
  minus: MinusIcon,
  chevronDown: ChevronDownIcon,
  chevronRight: ChevronRightIcon,
  code2: Code2Icon
};