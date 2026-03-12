// Core date formatter with automatic timezone detection and enhanced features
export function formatDate(
  dateInput: Date | string | number,
  options: {
    format?: 'iso' | 'utc' | 'rfc1123' | 'relative' | 'custom' | 'local';
    locale?: string;
    customFormat?: string;
    baseDate?: Date; // For relative formatting
    timeZone?: string; // Optional override
    includeTimezone?: boolean; // Show timezone info
  } = {}
): string {
  // Parse input to Date object
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  
  // Validate date
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date value');
  }

  // Auto-detect user's timezone if not provided
  const userTimeZone = options.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const userLocale = options.locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
  const format = options.format || 'local';

  // Standardized formats
  if (format === 'iso') return date.toISOString();
  if (format === 'utc' || format === 'rfc1123') return date.toUTCString();

  // Relative time formatting
  if (format === 'relative') {
    return formatRelativeTime(date, options.baseDate, userLocale);
  }

  // Custom format handling
  if (format === 'custom' && options.customFormat) {
    return formatWithCustomPattern(date, options.customFormat, userLocale, userTimeZone);
  }

  // Default localized format
  return formatLocalized(date, userLocale, userTimeZone, options.includeTimezone);
}

// Alias functions for common formats
export const formatDateToISO = (dateInput: Date | string | number) => 
  formatDate(dateInput, { format: 'iso' });

// Re-add formatDateForServer as alias for compatibility
export const formatDateForServer = formatDateToISO;

export const formatDateToUTC = (dateInput: Date | string | number) => 
  formatDate(dateInput, { format: 'utc' });

export const formatDateToRFC1123 = (dateInput: Date | string | number) => 
  formatDate(dateInput, { format: 'rfc1123' });

// Enhanced custom pattern formatter with token support
function formatWithCustomPattern(
  date: Date,
  pattern: string,
  locale: string,
  timeZone: string
): string {
  const formatTokenHandlers: Record<string, () => string> = {
    // Year
    'YYYY': () => date.getFullYear().toString(),
    'YY': () => date.getFullYear().toString().slice(-2),
    
    // Month
    'MMMM': () => new Intl.DateTimeFormat(locale, { timeZone, month: 'long' }).format(date),
    'MMM': () => new Intl.DateTimeFormat(locale, { timeZone, month: 'short' }).format(date),
    'MM': () => (date.getMonth() + 1).toString().padStart(2, '0'),
    'M': () => (date.getMonth() + 1).toString(),
    
    // Day
    'DD': () => date.getDate().toString().padStart(2, '0'),
    'D': () => date.getDate().toString(),
    'Do': () => {
      const day = date.getDate();
      return `${day}${getOrdinalSuffix(day, locale)}`;
    },
    'dddd': () => new Intl.DateTimeFormat(locale, { timeZone, weekday: 'long' }).format(date),
    'ddd': () => new Intl.DateTimeFormat(locale, { timeZone, weekday: 'short' }).format(date),
    'dd': () => new Intl.DateTimeFormat(locale, { timeZone, weekday: 'narrow' }).format(date),
    
    // Time
    'HH': () => date.getHours().toString().padStart(2, '0'),
    'H': () => date.getHours().toString(),
    'hh': () => {
      const hours = date.getHours() % 12 || 12;
      return hours.toString().padStart(2, '0');
    },
    'h': () => {
      const hours = date.getHours() % 12 || 12;
      return hours.toString();
    },
    'mm': () => date.getMinutes().toString().padStart(2, '0'),
    'm': () => date.getMinutes().toString(),
    'ss': () => date.getSeconds().toString().padStart(2, '0'),
    's': () => date.getSeconds().toString(),
    'SSS': () => date.getMilliseconds().toString().padStart(3, '0'),
    'A': () => date.getHours() >= 12 ? 'PM' : 'AM',
    'a': () => date.getHours() >= 12 ? 'pm' : 'am',
    
    // Timezone
    'Z': () => {
      const offset = -date.getTimezoneOffset();
      const sign = offset >= 0 ? '+' : '-';
      return `${sign}${Math.floor(Math.abs(offset) / 60).toString().padStart(2, '0')}:${(Math.abs(offset) % 60).toString().padStart(2, '0')}`;
    },
    'ZZ': () => {
      const offset = -date.getTimezoneOffset();
      const sign = offset >= 0 ? '+' : '-';
      return `${sign}${Math.floor(Math.abs(offset) / 60).toString().padStart(2, '0')}${(Math.abs(offset) % 60).toString().padStart(2, '0')}`;
    },
    'z': () => timeZone.split('/').pop()?.replace(/_/g, ' ') || timeZone,
    
    // Unix timestamp
    'X': () => Math.floor(date.getTime() / 1000).toString(),
  };

  // Replace tokens with their values
  return pattern.replace(
    /(\\?)(YYYY|YY|MMMM|MMM|MM|M|DD|D|Do|dddd|ddd|dd|HH|H|hh|h|mm|m|ss|s|SSS|A|a|Z|ZZ|z|X)/g, 
    (_, escape, token) => {
      return escape ? token : (formatTokenHandlers[token]?.() || token);
    }
  );
}

// Get ordinal suffix for day numbers (1st, 2nd, etc.)
function getOrdinalSuffix(day: number, locale: string): string {
  if (locale.startsWith('en')) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
  return '';
}

// Modern relative time formatter with enhanced accuracy
function formatRelativeTime(
  date: Date,
  baseDate: Date = new Date(),
  locale: string = 'en-US'
): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diff = date.getTime() - baseDate.getTime();
  const absDiff = Math.abs(diff);
  
  // Handle future/past
  const direction = diff < 0 ? -1 : 1;
  const absValue = absDiff;
  
  // Time units in milliseconds
  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;
  
  // Find the most appropriate unit
  let unit: Intl.RelativeTimeFormatUnit;
  let value: number;
  
  if (absValue < SECOND * 45) {
    unit = 'second';
    value = Math.round(absValue / SECOND) * direction;
  } else if (absValue < MINUTE * 45) {
    unit = 'minute';
    value = Math.round(absValue / MINUTE) * direction;
  } else if (absValue < HOUR * 22) {
    unit = 'hour';
    value = Math.round(absValue / HOUR) * direction;
  } else if (absValue < WEEK * 4) {
    unit = 'day';
    value = Math.round(absValue / DAY) * direction;
  } else if (absValue < MONTH * 11) {
    unit = 'month';
    value = Math.round(absValue / MONTH) * direction;
  } else {
    unit = 'year';
    value = Math.round(absValue / YEAR) * direction;
  }
  
  return rtf.format(value, unit);
}

// Default localized formatter
function formatLocalized(
  date: Date,
  locale: string,
  timeZone: string,
  includeTimezone = false
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZoneName: includeTimezone ? 'short' : undefined
  }).format(date);
}

// User-friendly localized formats (auto timezone)
export const formatLocalDate = (
  dateInput: Date | string | number, 
  locale?: string, 
  includeTime = false
): string => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat(locale, { 
    timeZone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit'
    })
  }).format(date);
};

export const formatLocalTime = (
  dateInput: Date | string | number, 
  locale?: string,
  includeSeconds = false
): string => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat(locale, { 
    timeZone,
    hour: '2-digit', 
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' })
  }).format(date);
};

// Common presets with auto-timezone
export const formatShortDate = (
  dateInput: Date | string | number, 
  locale?: string
): string => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: '2-digit',
    month: 'numeric',
    day: 'numeric'
  }).format(date);
};

export const formatLongDate = (
  dateInput: Date | string | number, 
  locale?: string
): string => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(date);
};

export const formatWeekday = (
  dateInput: Date | string | number, 
  locale?: string
): string => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat(locale, { 
    timeZone,
    weekday: 'long' 
  }).format(date);
};

export const formatRelativeDate = (
  dateInput: Date | string | number, 
  baseDate?: Date, 
  locale?: string
): string => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return formatDate(date, { format: 'relative', baseDate, locale });
};

// Additional utilities with auto-timezone
export const formatMonthYear = (
  dateInput: Date | string | number, 
  locale?: string
): string => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat(locale, { 
    timeZone,
    month: 'long',
    year: 'numeric'
  }).format(date);
};

export const formatYear = (dateInput: Date | string | number): string => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return date.getFullYear().toString();
};

export const formatQuarter = (
  dateInput: Date | string | number, 
  locale?: string
): string => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  if (locale) {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      year: 'numeric',
      month: 'short'
    }).format(date) + ` (Q${quarter})`;
  }
  
  return `Q${quarter} ${date.getFullYear()}`;
};

// Timezone-aware ISO format with offset
export const formatISOWithTimezone = (
  dateInput: Date | string | number
): string => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const tzOffset = -date.getTimezoneOffset();
  const sign = tzOffset >= 0 ? '+' : '-';
  const pad = (num: number) => `${Math.floor(Math.abs(num))}`.padStart(2, '0');
  
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${pad(tzOffset / 60)}:${pad(tzOffset % 60)}`;
};

// Duration formatting
export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1000) return `${milliseconds}ms`;
  
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};

// Date manipulation utilities
export const addDays = (
  dateInput: Date | string | number, 
  days: number
): Date => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};

export const addHours = (
  dateInput: Date | string | number, 
  hours: number
): Date => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
};

export const startOfDay = (
  dateInput: Date | string | number
): Date => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (
  dateInput: Date | string | number
): Date => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};