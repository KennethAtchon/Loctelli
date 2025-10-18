/**
 * Utility functions and helpers
 */

export { HttpClient } from './http';
export type { HttpClientConfig } from './http';

/**
 * Validate required fields in an object
 */
export function validateRequired<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): void {
  const missing = fields.filter((field) => !obj[field]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required fields: ${missing.map(String).join(', ')}`
    );
  }
}

/**
 * Wait for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('1') && cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (!cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }
  return cleaned;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
