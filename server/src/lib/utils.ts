import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export * from './utils';
export * from './generate-id';
export * from './cn';
export * from './formatDate';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
