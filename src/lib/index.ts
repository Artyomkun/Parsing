import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export * from './utils';
export * from './generate-id';

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
 */
export function truncate(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Преобразует первую букву строки в верхний регистр
 * @param str Исходная строка
 * @returns Строка с заглавной первой буквой
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Форматирует число в денежном формате
 * @param number Число для форматирования
 * @param currency Валюта (по умолчанию 'RUB')
 * @returns Отформатированная денежная строка
 */
export function formatCurrency(
  number: number,
  currency: string = 'RUB'
): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(number);
}