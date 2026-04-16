// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { HttpRequestHandler } from './HttpRequestHandler.js';
import { TokenClient } from '../OAuth/TokenClient.js';
import { AccessKey } from '../OAuth/AccessKey.js';
import { BeforeFetchResult } from './BeforeFetchResult.js';

export class OAuthClientCredentialsHandler implements HttpRequestHandler {
  // A valid JWK access key taken from the Laserfiche Developer Console
  // config page for your application.
  private _tokenClient: TokenClient;
  private _accessToken: string | undefined;

  /**
   * Constructor
   * @param servicePrincipalKey - The service principal key created for the service principal from the Laserfiche Account Administration.
   * @param accessKey - The access key exported from the Laserfiche Developer Console.
   * @param scope - Specifies the requested scopes for the authorization request. Scopes are case-sensitive and space-delimited.
   */
  public constructor(private servicePrincipalKey: string, private accessKey: AccessKey, private scope?: string) {
    if (!servicePrincipalKey)
      throw new Error('Service principal key cannot be blank.');

    this._tokenClient = new TokenClient(this.accessKey.domain);
  }

  /**
   * Called to prepare the request to the API service.
   * @param url - The HTTP url
   * @param request - The HTTP request
   */
  async beforeFetchRequestAsync(url: string, request: RequestInit): Promise<BeforeFetchResult> {
    if (!this._accessToken) {
      const resp = await this._tokenClient.getAccessTokenFromServicePrincipal(this.servicePrincipalKey, this.accessKey, this.scope);
      if (resp?.access_token) this._accessToken = resp.access_token;
      else console.warn(`getAccessToken did not return a token. ${resp}`);
    }

    if (this._accessToken) (request.headers as Record<string, unknown>)['Authorization'] = 'Bearer ' + this._accessToken;

    return {
      regionalDomain: this.accessKey.domain,
    };
  }

  /**
   * Called to handle the response from the API service.
   * @param url - The HTTP url
   * @param response - The HTTP response
   * @param request - The HTTP request
   * @returns true if the request should be retried.
   */
  async afterFetchResponseAsync(url: string, response: Response, _request: RequestInit): Promise<boolean> {
    if (response.status === 401) {
      this._accessToken = undefined;
      return true;
    }
    return false;
  }
}
