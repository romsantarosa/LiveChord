import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export * from './transpose';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
