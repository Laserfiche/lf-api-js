// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
/**
 * Laserfiche Cloud endpoints
 */
 export interface LfEndpoints {
  webClientUrl: string;
  wsignoutUrl: string;
  regionalDomain: string;
  oauthAuthorizeUrl: string;
}

/**
 * Returns region-specific Laserfiche Cloud endpoints
 * @param regionalDomain regional specific host, such as 'laserfiche.com', or 'eu.laserfiche.com'
 * @returns
 * @example
 * ```typescript
 * getLfEndpoints('laserfiche.com');
 *  // => {
 *  //      webClientUrl: 'https://app.laserfiche.com/laserfiche',
 *  //      wsignoutUrl: 'https://accounts.laserfiche.com/WebSTS/?wa=wsignout1.0',
 *  //      regionalDomain: 'laserfiche.com',
 *  //      oauthAuthorizeUrl: `https://signin.laserfiche.com/oauth/Authorize`,
 *  //     }
 *
 *  getLfEndpoints('eu.laserfiche.com');
 *  // => {
 *  //      webClientUrl: 'https://app.eu.laserfiche.com/laserfiche',
 *  //      wsignoutUrl: 'https://accounts.eu.laserfiche.com/WebSTS/?wa=wsignout1.0',
 *  //      regionalDomain: 'eu.laserfiche.com',
 *  //      oauthAuthorizeUrl: `https://signin.eu.laserfiche.com/oauth/Authorize`,
 *  //     }
 * ```
 */
 export function getLfEndpoints(regionalDomain: string): LfEndpoints {
  if (!regionalDomain) throw new Error('regionalDomain is undefined.');
  return {
    webClientUrl: `https://app.${regionalDomain}/laserfiche`,
    wsignoutUrl: `https://accounts.${regionalDomain}/WebSTS/?wa=wsignout1.0`,
    regionalDomain,
    oauthAuthorizeUrl: `https://signin.${regionalDomain}/oauth/Authorize`,
  };
}

/**
 * Creates the Laserfiche repository API base address
 * @param regionDomain Laserfiche Cloud Regional Domain
 * @returns Laserfiche repository API base address
 * @example
 * ```typescript
 * getRepositoryEndpoint('laserfiche.com'); // 'https://api.laserfiche.com/repository'
 * ```
 */
export function getRepositoryEndpoint(regionDomain: string): string {
  if (!regionDomain) throw new Error('regionDomain is undefined.');
  return `https://api.${regionDomain}/repository`;
}

/**
 * Creates the Laserfiche Oauth Token endpoint
 * @param regionDomain Laserfiche Cloud Regional Domain
 * @returns Laserfiche Oauth Token endpoint
 * @example
 * ```typescript
 * getOauthTokenUrl('laserfiche.com'); // 'https://signin.laserfiche.com/oauth/Token'
 * ```
 */
 export function getOauthTokenUrl(regionDomain: string): string {
  if (!regionDomain) throw new Error('regionDomain is undefined.');
  return `https://signin.${regionDomain}/oauth/Token`;
}

