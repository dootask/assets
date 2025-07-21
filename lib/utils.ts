import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeString(value: unknown, defaultValue: string = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return defaultValue;
}
