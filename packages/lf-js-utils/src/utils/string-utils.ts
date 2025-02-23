// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { isBrowser } from './core-utils.js';

/**
 * Returns the formatted string.
 * It will replace parameters of the format {x}, where x is a number and will be used as
 * the index to find the value in the array of params
 * @param stringToFormat - The string to format
 * @param params - The params to replace
 * @returns String with the params replaced. Will throw if the number of replacement parameters do not mat
 * @example
 * ```typescript
 * const formattedString = formatString('Do you like {0} and {1}? I like {0}', ['apples', 'bananas'])
 * // formattedString = 'Do you like apples and bananas? I like apples'
 * ```
 */
export function formatString(stringToFormat: string, params?: string[]): string {
  const expectedParams: RegExpMatchArray | [] = stringToFormat.match(/\{\d+\}/g) ?? [];
  const expectedNumParams: number = new Set(expectedParams).size;

  if (
    (expectedNumParams > 0 && params?.length !== expectedNumParams) ||
    (expectedNumParams === 0 && params && params.length > 0)
  ) {
    throw new Error(`Expected ${expectedNumParams} arguments. Actual arguments: ${params?.length ?? '0'}.`);
  }

  if (params && params.length > 0) {
    for (let i = 0; i < params.length; i++) {
      const replacement: string = params[i];
      const varRegex: RegExp = new RegExp(`\\{${i}\\}`, 'g');
      stringToFormat = stringToFormat.replace(varRegex, replacement);
    }
  }
  return stringToFormat;
}

/**
 * Decodes a string of data encoded using Base64 encoding
 * @param base64String - Base64 encoded string
 * @returns Ascii encoded string
 * @example
 * ```typescript
 * base64toString('dGVzdA=='); // => 'test';
 * ```
 */
export function base64toString(base64String: string): string {
  if (isBrowser()) {
    return window.atob(base64String);
  } else {
    return Buffer.from(base64String, 'base64').toString();
  }
}

/**
 * Encodes a string of data using Base64 encoding
 * @param asciiString - Ascii encoded string
 * @returns Base64 encoded string
 * @example
 * ```typescript
 * stringToBase64('test'); // => 'dGVzdA==';
 * ```
 */
export function stringToBase64(asciiString: string): string {
  if (isBrowser()) {
    return window.btoa(asciiString);
  } else {
    return Buffer.from(asciiString).toString('base64');
  }
}

/**
 * Converts an ArrayBuffer to a base64 string
 * @param buffer - ArrayBuffer to encode into base64
 * @returns Base64 encoded string
 * @example
 * ```typescript
 * const buffer = new Uint8Array(4);
 * arrayBufferToBase64(buffer); // => 'AAAAAA==';
 * ```
 */
export function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return stringToBase64(binary);
}

/**
 * Convert a decimal number to hexadecimal number
 * @param dec - Number in base 10
 * @returns Hexadecimal string
 * @example
 * ```typescript
 * base10ToBase16(16);  // => '10'
 * ```
 */
export function base10ToBase16(dec: number): string {
  return dec.toString(16).padStart(2, '0');
}

/**
 * Removes all the trailing occurrences of a character from a string.
 * @param value - String to trim
 * @param endValue - String to remove
 * @returns Trimmed string
 */
export function trimEnd(value: string, endValue: string): string {
  return value.endsWith(endValue) ? value.substring(0, value.length - endValue.length) : value;
}

/**
 * Function to convert bytes to an abbreviated format
 * @param bytes - Number of bytes
 * @param numOfFractionalDigits - Number of digits after the decimal place
 * @returns String representing the bytes in abbreviated form (KB, MB, GB, etc.)
 * @example
 * ```typescript
 * convertBytesToString(1024); // 1 KB
 * convertBytesToString(1027); // 1.00 KB
 * convertBytesToString(1500000); // 1.43 MB
 * ```
 */
export function convertBytesToString(bytes: number, numOfFractionalDigits: number = 2): string {
  if (bytes < 0.0) {
    return '';
  }
  let suffix = 'B';
  if (bytes >= 1024.0) {
    bytes /= 1024.0;
    suffix = 'KB';
  }
  if (bytes >= 1024.0) {
    bytes /= 1024.0;
    suffix = 'MB';
  }
  if (bytes >= 1024.0) {
    bytes /= 1024.0;
    suffix = 'GB';
  }
  if (bytes >= 1024.0) {
    bytes /= 1024.0;
    suffix = 'TB';
  }

  if (suffix === 'B') {
    return `${bytes} ${suffix}`;
  }
  if (Number.isInteger(bytes)) {
    return `${bytes} ${suffix}`;
  }
  return `${bytes.toFixed(numOfFractionalDigits)} ${suffix}`;
}
