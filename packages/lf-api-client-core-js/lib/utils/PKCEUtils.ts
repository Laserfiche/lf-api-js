// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { CoreUtils, StringUtils } from "@laserfiche/lf-js-utils";

/**
 * Generates a random PKCE code verifier
 * @returns PKCE code verifier
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(25);
  const randomString = generateRandomValuesFromArray(array);
  const code_verifier_raw = Array.from(randomString, StringUtils.base10ToBase16).join('');
  const code_verifier = StringUtils.stringToBase64(code_verifier_raw)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return code_verifier;
}

/**
 * Generates a PKCE code challenge given the code verifier
 * @param code_verifier
 * @returns The PKCE code challenge
 */
export async function generateCodeChallengeAsync(code_verifier: string): Promise<string> {
  const base64CodeVerifierHash = (await createBase64SHA256HashAsync(code_verifier))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return base64CodeVerifierHash;
}

// Generates random array
function generateRandomValuesFromArray(array: Uint8Array): Uint8Array {
  if (!CoreUtils.isBrowser()) {
    throw new Error('generateRandomValuesFromArray not implemented in node js.');
  }
  let randomArray = window.crypto.getRandomValues(array);
  return randomArray;
}

async function createBase64SHA256HashAsync(message: string): Promise<string> {
  if (!CoreUtils.isBrowser()) {
    throw new Error('createBase64SHA256HashAsync not implemented in node js.');
  }
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8); // hash the message
  const hashEncoded = StringUtils.arrayBufferToBase64(hashBuffer)
  return hashEncoded;
}
