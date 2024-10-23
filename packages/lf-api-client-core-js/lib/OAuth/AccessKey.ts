// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { StringUtils } from '@laserfiche/lf-js-utils';
import { JWK } from './JWK.js';
import { KEYUTIL, KJUR } from 'jsrsasign';

/**
 * The access key exported from the Laserfiche Developer Console.
 */
export interface AccessKey {
  /**
   * The account ID associated to the application
   */
  customerId: string;

  /**
   * The client ID for the application. You can find the client ID
   * on the Laserfiche Developer Console config page for your application
   */
  clientId: string;

  /**
   * The domain for the API environment
   */
  domain: string;

  /**
   * The application's json web key.
   */
  jwk: JWK;
}

interface jwtPayload {
  client_id: string;
  client_secret: string;
  exp?: number;
  aud: string;
  iat: number;
  nbf: number;
  scope?: string;
}

/**
 * Creates an AccessKey given a base-64 encoded access key.
 * @param base64EncodedAccessKey The base-64 encoded access key exported from the Laserfiche Developer Console.
 */
export function createFromBase64EncodedAccessKey(base64EncodedAccessKey: string): AccessKey {
  const accessKeyStr: string = StringUtils.base64toString(base64EncodedAccessKey);
  const accessKey = JSON.parse(accessKeyStr);
  if (!accessKey?.jwk?.kid) {
    throw new Error('base64EncodedAccessKey cannot be parsed.');
  }
  return accessKey;
}

/**
 * Create OAuth 2.0 client_credentials Authorization JWT that can be used with Laserfiche Cloud Token endpoint to request an Access Token.
 * @param servicePrincipalKey - The service principal key created for the service principal from the Laserfiche Account Administration.
 * @param accessKey - AccessKey JSON object or base-64 encoded AccessKey exported from the Laserfiche Developer Console.
 * @param expireInSeconds - The expiration time in seconds for the authorization JWT with a default value of 3600 seconds. Set it to 0 if the JWT never expires.
 * @param scope - (optional) The requested scopes. Applies only when the generated key is used as a HTTP Basic Authorization password. Scopes are case-sensitive and space-delimited. (Ex/ 'repository.Read repository.Write')
 * @returns Authorization JWT.
 */
export function createClientCredentialsAuthorizationJwt(
  servicePrincipalKey: string,
  accessKey: AccessKey | string,
  expireInSeconds = 3600,
  scope?: string
): string {
  const currentTime: any = new Date(); // the current time in milliseconds
  const nowSecondsFrom1970: number = Math.ceil(currentTime / 1000 - 1);
  const audience: string = 'laserfiche.com';
  const maxScopesLength: number = 32768; // 2^15

  if (typeof accessKey === 'string') {
    accessKey = createFromBase64EncodedAccessKey(accessKey);
  }

  const payload: jwtPayload = {
    client_id: accessKey.clientId,
    client_secret: servicePrincipalKey,
    aud: audience,
    iat: nowSecondsFrom1970,
    nbf: nowSecondsFrom1970,
  };

  scope = scope?.trim();
  if (scope) {
    if (scope.length > maxScopesLength) {
      throw new Error(`Scopes value exceeded max length of ${maxScopesLength}`);
    }
    payload.scope = scope;
  }

  if (expireInSeconds) {
    const expireSecondsFrom1970: number = Math.ceil(nowSecondsFrom1970 + expireInSeconds);
    if (expireSecondsFrom1970 <= nowSecondsFrom1970) {
      throw new Error('Expiration time must be later than the current time.');
    }
    payload.exp = expireSecondsFrom1970;
  }

  const options = {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      typ: 'JWT',
      kid: accessKey.jwk.kid,
    },
  };

  const privateKey = KEYUTIL.getKey(<any>accessKey.jwk);

  const token = KJUR.jws.JWS.sign(options.algorithm, options.header, payload, <any>privateKey);

  return token;
}
