import {type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Converts bytes to a human-readable file size string
 * @param bytes - Size in bytes
 * @returns Human-readable size string (e.g., "1.5 MB", "256 KB")
 */


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
};

export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export const generateUUID = ()=> crypto.randomUUID();

