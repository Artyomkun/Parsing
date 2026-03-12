const DEFAULT_ID_LENGTH = 12;
const ALPHANUMERIC_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const MAX_UNIQUE_ATTEMPTS = 1000;

/**
 * Generates a random alphanumeric string
 * @param length - Length of the string to generate
 * @returns Random alphanumeric string
 */
export function generateRandomString(length: number = DEFAULT_ID_LENGTH): string {
  let result = '';
  const charsLength = ALPHANUMERIC_CHARS.length;
  
  // Используем криптографически безопасный метод, если доступен
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    
    for (let i = 0; i < length; i++) {
      result += ALPHANUMERIC_CHARS[values[i] % charsLength];
    }
  } else {
    // Fallback для сред без crypto
    for (let i = 0; i < length; i++) {
      result += ALPHANUMERIC_CHARS.charAt(
        Math.floor(Math.random() * charsLength)
      );
    }
  }
  
  return result;
}

interface IdGenerationOptions {
  prefix?: string;
  suffix?: string;
  randomLength?: number;
  timestamp?: boolean | string;
  customFormat?: string;
  idLength?: number;
  separator?: string;
  includeRandom?: boolean;
  checksum?: boolean;
}

/**
 * Generates a customizable ID with various options
 * @param options - Configuration options for ID generation
 * @returns Generated ID string
 */
export function generateId(options: IdGenerationOptions = {}): string {
  const {
    prefix = '',
    suffix = '',
    randomLength = DEFAULT_ID_LENGTH,
    timestamp = false,
    customFormat,
    idLength = DEFAULT_ID_LENGTH,
    separator = '-',
    includeRandom = true,
    checksum = false
  } = options;

  const parts: string[] = [];
  
  // Обработка префикса
  if (prefix) parts.push(prefix);
  
  // Обработка кастомного формата
  if (customFormat) {
    let formatted = customFormat;
    
    // Заменяем плейсхолдеры
    formatted = formatted.replace(/{id}/g, generateRandomString(idLength));
    
    if (timestamp) {
      const tsValue = typeof timestamp === 'string' 
        ? new Date().toISOString().slice(0, timestamp.length)
        : Date.now().toString();
        
      formatted = formatted.replace(/{timestamp}/g, tsValue);
    }
    
    if (includeRandom) {
      formatted = formatted.replace(/{random}/g, generateRandomString(randomLength));
    }
    
    parts.push(formatted);
  } else {
    // Генерация стандартного ID
    if (includeRandom) {
      parts.push(generateRandomString(idLength));
    }
    
    // Добавление временной метки
    if (timestamp) {
      const tsValue = typeof timestamp === 'string' 
        ? new Date().toISOString().slice(0, timestamp.length)
        : Date.now().toString();
      parts.push(tsValue);
    }
  }
  
  // Обработка суффикса
  if (suffix) parts.push(suffix);
  
  // Сборка финального ID
  let id = parts.join(separator);
  
  // Добавление контрольной суммы при необходимости
  if (checksum) {
    id += separator + calculateChecksum(id);
  }
  
  return id;
}

/**
 * Вычисляет простую контрольную сумму для строки
 */
function calculateChecksum(str: string): string {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i);
  }
  return (sum % 36).toString(36).toUpperCase();
}

/**
 * Generates a unique ID that doesn't exist in the provided set
 * @param existingIds - Set of existing IDs to avoid collisions
 * @param options - Configuration options for ID generation
 * @returns Unique ID string
 * @throws Error if unique ID can't be generated after maximum attempts
 */
export function generateUniqueId(
  existingIds: Set<string>,
  options: IdGenerationOptions = {}
): string {
  let id: string;
  let attempts = 0;
  
  do {
    id = generateId({
      ...options,
      timestamp: true, // Гарантирует уникальность
      checksum: false // Отключаем для уникальности
    });
    
    attempts++;
    
    if (attempts > MAX_UNIQUE_ATTEMPTS) {
      throw new Error(`Failed to generate unique ID after ${MAX_UNIQUE_ATTEMPTS} attempts`);
    }
  } while (existingIds.has(id));
  
  existingIds.add(id);
  return id;
}

// Фабричные функции для распространенных шаблонов
export const idGenerator = {
  withPrefix: (prefix: string) => generateId({ prefix }),
  withSuffix: (suffix: string) => generateId({ suffix }),
  withTimestamp: () => generateId({ timestamp: true }),
  withRandom: (length: number = DEFAULT_ID_LENGTH) => generateId({ randomLength: length }),
  withPrefixAndTimestamp: (prefix: string) => generateId({ prefix, timestamp: true }),
  withPrefixAndRandom: (prefix: string, length: number) => generateId({ prefix, randomLength: length }),
  withSuffixAndTimestamp: (suffix: string) => generateId({ suffix, timestamp: true }),
  withPrefixSuffixAndTimestamp: (prefix: string, suffix: string) => (
    generateId({ prefix, suffix, timestamp: true })
  ),
  forUser: () => generateId({ prefix: 'user', timestamp: true, separator: '_' }),
  forOrder: () => generateId({ prefix: 'ord', timestamp: 'YYYYMMDD', separator: '' }),
  forProduct: (category: string) => generateId({ prefix: `prod_${category}`, randomLength: 8 }),
  forSession: () => generateId({ prefix: 'sess', randomLength: 32, separator: '' }),
  forAPI: () => generateId({ prefix: 'api', randomLength: 24, separator: '_', checksum: true }),
};

// Unique ID factory functions
export const uniqueIdGenerator = {
  withPrefix: (prefix: string, existingIds: Set<string>) => (
    generateUniqueId(existingIds, { prefix })
  ),
  withSuffix: (suffix: string, existingIds: Set<string>) => (
    generateUniqueId(existingIds, { suffix })
  ),
  withTimestamp: (existingIds: Set<string>) => (
    generateUniqueId(existingIds, { timestamp: true })
  ),
  withCustomFormat: (format: string, existingIds: Set<string>) => (
    generateUniqueId(existingIds, { customFormat: format })
  ),
  forUser: (existingIds: Set<string>) => (
    generateUniqueId(existingIds, { prefix: 'user', timestamp: true, separator: '_' })
  ),
  forDocument: (existingIds: Set<string>) => (
    generateUniqueId(existingIds, { prefix: 'doc', randomLength: 12 })
  ),
};

/**
 * Расширенная функция для генерации ID для конкретных сущностей
 */
export function entityIdGenerator(entityType: string, options: Omit<IdGenerationOptions, 'prefix'> = {}) {
  return generateId({
    prefix: entityType.toLowerCase(),
    ...options
  });
}

/**
 * Генератор уникальных ID для сущностей
 */
export function uniqueEntityIdGenerator(
  entityType: string,
  existingIds: Set<string>,
  options: Omit<IdGenerationOptions, 'prefix'> = {}
) {
  return generateUniqueId(existingIds, {
    prefix: entityType.toLowerCase(),
    ...options
  });
}

// Дополнительные утилиты
export const idUtils = {
  validate: (id: string, pattern?: RegExp) => {
    if (pattern) return pattern.test(id);
    
    // Базовая проверка по умолчанию
    return /^[a-zA-Z0-9_\-]{8,64}$/.test(id);
  },
  
  extractParts: (id: string, separator: string = '-') => {
    return id.split(separator);
  },
  
  getTimestamp: (id: string) => {
    const match = id.match(/(\d{10,13})$/);
    if (match) return parseInt(match[1], 10);
    return null;
  },
  
  verifyChecksum: (id: string, separator: string = '-') => {
    const parts = id.split(separator);
    if (parts.length < 2) return false;
    
    const checksum = parts.pop()!;
    const baseId = parts.join(separator);
    return calculateChecksum(baseId) === checksum;
  }
};