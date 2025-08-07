export function formatDate(date: Date, locale: string = 'en-US', options?: Intl.DateTimeFormatOptions): string {
    return date.toLocaleDateString(locale, options);
}
export function formatDateToISO(date: Date): string {
  return date.toISOString();
}
export function formatDateToUTC(date: Date): string {
  return date.toUTCString();
}
export function formatDateToLocaleString(date: Date, locale: string = 'en-US', options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleString(locale, options);
}
export function formatDateToLocaleTimeString(date: Date, locale: string = 'en-US', options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleTimeString(locale, options);
}
export function formatDateToLocaleDateString(date: Date, locale: string = 'en-US', options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString(locale, options);
}
export function formatDateToCustomFormat(date: Date, format: string): string {
  const options: Intl.DateTimeFormatOptions = {};
  if (format.includes('YYYY')) options.year = 'numeric';
  if (format.includes('MM')) options.month = '2-digit';
  if (format.includes('DD')) options.day = '2-digit';
  if (format.includes('HH')) options.hour = '2-digit';
  if (format.includes('mm')) options.minute = '2-digit';
  if (format.includes('ss')) options.second = '2-digit';

  return date.toLocaleDateString('en-US', options).replace(/,/g, '');
}
export function formatDateToRelative(date: Date, baseDate: Date = new Date()): string {
  const diff = date.getTime() - baseDate.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
}
export function formatDateToShort(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { year: '2-digit', month: '2-digit', day: '2-digit' };
  return date.toLocaleDateString('en-US', options).replace(/\//g, '-');
}
export function formatDateToLong(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}
export function formatDateToTime(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
  return date.toLocaleTimeString('en-US', options);
}
export function formatDateToWeekday(date: Date, locale: string = 'en-US'): string {
  return date.toLocaleDateString(locale, { weekday: 'long' });
}
export function formatDateToMonth(date: Date, locale: string = 'en-US'): string {
  return date.toLocaleDateString(locale, { month: 'long' });
}
export function formatDateToYear(date: Date): string {
  return date.getFullYear().toString();
}
export function formatDateToQuarter(date: Date): string {
  const month = date.getMonth();
  const quarter = Math.floor(month / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
}
export function formatDateToDayOfYear(date: Date): string {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return `Day ${dayOfYear}`;
}
export function formatDateToISOWithTimezone(date: Date): string {
  const offset = date.getTimezoneOffset();
  const sign = offset > 0 ? '-' : '+';
  const absOffset = Math.abs(offset);
  const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
  const minutes = String(absOffset % 60).padStart(2, '0');
  return `${date.toISOString().slice(0, -1)}${sign}${hours}:${minutes}`;
}
export function formatDateToRFC1123(date: Date): string {
  return date.toUTCString();
}
export function formatDateToCustomLocale(date: Date, locale: string, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString(locale, options);
}
export function formatDateToCustomLocaleTime(date: Date, locale: string, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleTimeString(locale, options);
}
export function formatDateToCustomLocaleDate(date: Date, locale: string, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString(locale, options);
}
export function formatDateToCustomLocaleString(date: Date, locale: string, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleString(locale, options);
}
export function formatDateToCustomLocaleWithFormat(date: Date, locale: string, format: string): string {
  const options: Intl.DateTimeFormatOptions = {};
  if (format.includes('YYYY')) options.year = 'numeric';
  if (format.includes('MM')) options.month = '2-digit';
  if (format.includes('DD')) options.day = '2-digit';
  if (format.includes('HH')) options.hour = '2-digit';
  if (format.includes('mm')) options.minute = '2-digit';
  if (format.includes('ss')) options.second = '2-digit';

  return date.toLocaleDateString(locale, options).replace(/,/g, '');
}
export function formatDateToCustomLocaleRelative(date: Date, baseDate: Date = new Date()): string {
  const diff = date.getTime() - baseDate.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} день${days > 1 ? 'я' : ''} назад`;
  if (hours > 0) return `${hours} час${hours > 1 ? 'а' : ''} назад`;
  if (minutes > 0) return `${minutes} минут${minutes > 1 ? 'ы' : ''} назад`;
  return `${seconds} секунд${seconds > 1 ? 'ы' : ''} назад`;
}
export function formatDateToCustomLocaleShort(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { year: '2-digit', month: '2-digit', day: '2-digit' };
  return date.toLocaleDateString('ru-RU', options).replace(/\//g, '-');
}
export function formatDateToCustomLocaleLong(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('ru-RU', options);
}
