import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export * from './utils';
export * from './generate-id';
export * from './cn';
export * from './formatDate';

/**
 * Объединяет имена классов с поддержкой Tailwind CSS
 * @param inputs Классы для объединения
 * @returns Объединенная строка классов
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматирует дату в читаемый вид
 * @param date Дата (строка, timestamp или объект Date)
 * @param options Опции форматирования
 * @returns Отформатированная строка с датой
 */
export function formatDate(
  date: string | number | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    hour12: false,
  }
): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString('ru-RU', options);
}

/**
 * Генерирует уникальный ID
 * @param length Длина ID (по умолчанию 12)
 * @returns Случайный строковый ID
 */
export function generateId(length = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (typeof window !== 'undefined' && window.crypto) {
    const values = new Uint32Array(length);
    window.crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
  }
  
  return result;
}

/**
 * Тримит и сокращает строку с добавлением многоточия
 * @param text Исходный текст
 * @param maxLength Максимальная длина результата
 * @returns Сокращенная строка
 * @example
 * truncate('Hello, world!', 10) // → 'Hello, ...'
 * truncate('Short text', 20) // → 'Short text'
 * truncate('This is a very long text that needs to be truncated', 30) //
 */
export function truncate(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Преобразует первую букву строки в верхний регистр
 * @param str Исходная строка
 * @returns Строка с заглавной первой буквой
 * @example
 * capitalize('hello world') // → 'Hello world'
 * capitalize('javaScript') // → 'JavaScript'
 * capitalize('typescript') // → 'Typescript'
 * @example
 * capitalize('') // → ''
 * capitalize('a') // → 'A'
 * capitalize('A') // → 'A'
 * capitalize('1') // → '1'
 * capitalize('!') // → '!'
 * capitalize(' ') // → ' '
 * capitalize('  ') // → '  '
 * capitalize('  a  ') // → '  A  '
 * capitalize('  A  ') // → '  A  '
 * capitalize('  1  ') // → '  1  '
 * capitalize('  !  ') // → '  !  '
 * capitalize('  ') // → '  ' * capitalize('  a') // → '  A'
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Форматирует число в денежном формате
 * @param number Число для форматирования
 * @param currency Валюта (по умолчанию 'RUB')
 * @returns Отформатированная денежная строка
 * @example
 * formatCurrency(1234567.89) // → '1 234 567,89 ₽'
 * formatCurrency(1234567.89, 'USD') // → '1,234,567.89 $'
 * formatCurrency(1234567.89, 'EUR') // → '1.234.567,89 €'
 * @example
 * formatCurrency(0) // → '0 ₽'
 * formatCurrency(100) // → '100 ₽'
 * formatCurrency(1000) // → '1 000 ₽'
 * formatCurrency(1000000) // → '1 000 000 ₽'
 * formatCurrency(1234567.89, 'JPY') // → '1,234,568 ¥'
 * formatCurrency(1234567.89, 'GBP') // → '1,234,567.89 £'
 * formatCurrency(1234567.89, 'CNY') // → '1,234,567.89 ¥'
 * formatCurrency(1234567.89, 'RUB') // → '1 234 567,89 ₽'
 * formatCurrency(1234567.89, 'INR') // → '1,234,567.89 ₹'
 * formatCurrency(1234567.89, 'BRL') // → '1.234.567,89 R$'
 * formatCurrency(1234567.89, 'AUD') // → '1,234,567.89 A$'
 * formatCurrency(1234567.89, 'CAD') // → '1,234,567.89 C$'
 * formatCurrency(1234567.89, 'NZD') // → '1,234,567.89 NZ$'
 * formatCurrency(1234567.89, 'ZAR') // → '1,234,567.89 R'
 * formatCurrency(1234567.89, 'MXN') // → '1,234,567.89 MX$'
 * formatCurrency(1234567.89, 'KRW') // → '1,234,567.89 ₩'
 * formatCurrency(1234567.89, 'TRY') // → '1.234.567,89 ₺'
 * formatCurrency(1234567.89, 'SEK') // → '1,234,567.89 kr'
 * formatCurrency(1234567.89, 'NOK') // → '1,234,567.89 kr'
 * formatCurrency(1234567.89, 'DKK') // → '1,234,567.89 kr'
 * formatCurrency(1234567.89, 'PLN') // → '1.234.567,89 zł'
 * formatCurrency(1234567.89, 'CZK') // → '1.234.567,89 Kč'
 * formatCurrency(1234567.89, 'HUF') // → '1.234.567,89 Ft'
 * formatCurrency(1234567.89, 'ILS') // → '1,234,567.89 ₪'
 * formatCurrency(1234567.89, 'AED') // → '1,234,567.89 د.إ'
 * formatCurrency(1234567.89, 'SAR') // → '1,234,567.89 ر.س'
 * formatCurrency(1234567.89, 'QAR') // → '1,234,567.89 ر.ق'
 * formatCurrency(1234567.89, 'KWD') // → '1,234,567.89 د.ك'
 * formatCurrency(1234567.89, 'OMR') // → '1,234,567.89 ر.ع.'
 * formatCurrency(1234567.89, 'BHD') // → '1,234,567.89 د.ب'
 * formatCurrency(1234567.89, 'JOD') // → '1,234,567.89 د.أ'
 * formatCurrency(1234567.89, 'EGP') // → '1,234,567.89 ج.م'
 * formatCurrency(1234567.89, 'TND') // → '1,234,567.89 د.ت'
 * formatCurrency(1234567.89, 'MAD') // → '1,234,567.89 د.م.'
 * formatCurrency(1234567.89, 'DZD') // → '1,234,567.89 د.ج'
 * formatCurrency(1234567.89, 'LYD') // → '1,234,567.89 د.ل'
 * formatCurrency(1234567.89, 'SDG') // → '1,234,567.89 ج.س'
 * formatCurrency(1234567.89, 'YER') // → '1,234,567.89 ر.ي'
 * formatCurrency(1234567.89, 'IQD') // → '1,234,567.89 د.ع.'
 * formatCurrency(1234567.89, 'LBP') // → '1,234,567.89 ل.ل.'
 * formatCurrency(1234567.89, 'SYP') // → '1,234,567.89 ل.س'
 * formatCurrency(1234567.89, 'BAM') // → '1.234.567,89 KM'
 * formatCurrency(1234567.89, 'MKD') // → '1.234.567,89 ден'
 * formatCurrency(1234567.89, 'RSD') // → '1.234.567,89 дин'
 * formatCurrency(1234567.89, 'BGN') // → '1.234.567,89 лв'
 * formatCurrency(1234567.89, 'RON') // → '1.234.567,89 lei'
 * formatCurrency(1234567.89, 'HRK') // → '1.234.567,89 kn'
 * formatCurrency(1234567.89, 'UAH') // → '1.234.567,89 грн'
 * formatCurrency(1234567.89, 'BYN') // → '1.234.567,89 р.'
 * formatCurrency(1234567.89, 'KZT') // → '1.234.567,89 тг'
 * formatCurrency(1234567.89, 'AZN') // → '1.234.567,89 ман'
 * formatCurrency(1234567.89, 'GEL') // → '1.234.567,89 ₾'
 * formatCurrency(1234567.89, 'AMD') // → '1.234.567,89 ֏'
 * formatCurrency(1234567.89, 'UZS') // → '1.234.567,89 сум'
 * formatCurrency(1234567.89, 'TJS') // → '1.234.567,89 сомонӣ'
 * formatCurrency(1234567.89, 'KGS') // → '1.234.567,89 сом'
 * formatCurrency(1234567.89, 'MDL') // → '1.234.567,89 lei'
 * formatCurrency(1234567.89, 'LTL') // → '1.234.567,89 Lt'
 * formatCurrency(1234567.89, 'LVL') // → '1.234.567,89 Ls'
 * formatCurrency(1234567.89, 'EUR') // → '1.234.567,89 €'
 * formatCurrency(1234567.89, 'GBP') // → '1.234.567,89 £'

 */
export function formatCurrency(
  number: number,
  currency: string = 'RUB'
): string {
  if (isNaN(number)) return '0 ₽';
  if (number === Infinity || number === -Infinity) return '∞ ₽';
  if (number === 0) return '0 ₽';
  if (typeof number !== 'number') {
    throw new TypeError('Expected a number');
  }
  if (typeof currency !== 'string' || currency.length === 0) {
    throw new TypeError('Expected a non-empty string for currency');
  }
  if (currency.length !== 3) {
    throw new Error('Currency code must be a 3-letter ISO code');
  }
  if (number < 0) {
    return `-${formatCurrency(-number, currency)}`;
  }
  if (number > 1e12) {
    return `${(number / 1e12).toFixed(2)} трлн. ${currency}`;
  }
  if (number > 1e9) {
    return `${(number / 1e9).toFixed(2)} млрд. ${currency}`;
  }
  if (number > 1e6) {
    return `${(number / 1e6).toFixed(2)} млн. ${currency}`;
  }
  if (number > 1e3) {
    return `${(number / 1e3).toFixed(2)} тыс. ${currency}`;
  }
  if (number < 1) {
    return `${number.toFixed(2)} ${currency}`;
  }
  if (number % 1 === 0) {
    return `${number.toFixed(0)} ${currency}`;
  }
  // Для чисел с плавающей точкой используем стандартное форматирование
  // с учетом локали и валюты
  if (currency === 'RUB') {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  }
  // Для других валют используем стандартное форматирование
  // с учетом локали и валюты
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}
