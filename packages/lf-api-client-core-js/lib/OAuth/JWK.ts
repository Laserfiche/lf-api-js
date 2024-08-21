// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
/**
 * JSON Web Key
 */
export interface JWK {
  kty: 'EC' | string;
  use: 'sig' | string;
  crv: 'P-256' | string;
  d: string;
  x: string;
  y: string;
  kid: string;
  [x: string]: unknown;
}
