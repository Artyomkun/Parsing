import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Усовершенствованная утилита для объединения классов с:
 * - Поддержкой всех вариантов ClassValue (строки, массивы, объекты)
 * - Автоматическим устранением конфликтов Tailwind CSS классов
 * - Оптимизацией производительности
 * - Полной TypeScript-типизацией
 * 
 * @param {...ClassValue} inputs - Аргументы классов для объединения
 * @returns {string} Оптимизированная строка классов
 * 
 * @example
 * // Базовое использование
 * cn('p-2', 'p-4') // → 'p-4'
 * 
 * @example
 * // Условные классы
 * cn('text-base', { 'text-red-500': isError, 'font-bold': isBold })
 * 
 * @example
 * // Смешанные типы
 * cn(['p-2', null, ['m-4']], { 'bg-blue-500': isActive })
 */
export function cn(...inputs: ClassValue[]): string {
  // 1. Быстрая обработка пустых случаев
  if (inputs.length === 0) return "";
  if (inputs.every(input => input == null || input === false)) return "";
  if (inputs.length === 1 && typeof inputs[0] === "string") return twMerge(inputs[0]);

  // 2. Оптимизация для примитивов
  if (inputs.length === 1) {
    const input = inputs[0];
    
    // Undefined/null
    if (input == null) return "";
    // Булевы значения - возвращаем пустую строку
    if (typeof input === "boolean") return "";
    // Числа - преобразуем в строку
    if (typeof input === "number") return String(input);
    // Функции - игнорируем
    if (typeof input === "function") return "";
    // Массивы - рекурсивно обрабатываем
    if (Array.isArray(input)) return cn(...input);
    // Объекты - применяем clsx для объединения
    if (typeof input === "object") {
      // Проверяем, есть ли Tailwind-классы
      const merged = clsx(input);
      return /(^|\s)([a-z0-9-]+:)?[a-z0-9-]+-[a-z0-9]+(\s|$)/i.test(merged)
        ? twMerge(merged)
        : merged;
    }
    
    // Строки - сразу применяем twMerge
    if (typeof input === "string") return twMerge(input);
    
    // Числа/булевы значения
    if (typeof input !== "object") return String(input);
  }

  // 3. Обработка сложных случаев через clsx
  const merged = clsx(...inputs);
  if (typeof merged !== "string") return "";
  if (merged.length === 0) return "";
  if (merged.trim().length === 0) return "";
  if (merged === "undefined" || merged === "null") return "";
  if (merged === "false" || merged === "true") return "";
  if (merged === "0" || merged === "1") return merged;
  if (merged === "NaN") return "";
  if (merged === "Infinity" || merged === "-Infinity") return "";
  if (merged === "null" || merged === "undefined") return "";
  if (merged === "false" || merged === "true") return "";
  
  // 4. Определяем наличие Tailwind-классов
  const hasTailwindClasses = 
    typeof merged === "string" && 
    /(^|\s)([a-z0-9-]+:)?[a-z0-9-]+-[a-z0-9]+(\s|$)/i.test(merged);

  // 5. Применяем twMerge только при необходимости
  return hasTailwindClasses ? twMerge(merged) : merged;
}
// Альтернативный экспорт для удобства
export default cn;