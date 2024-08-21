// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { HttpRequestHandler } from './HttpRequestHandler.js';
import { TokenClient } from '../OAuth/TokenClient.js';
import { AccessKey } from '../OAuth/AccessKey.js';
import { BeforeFetchResult } from './BeforeFetchResult.js';

export class OAuthClientCredentialsHandler implements HttpRequestHandler {
  // A valid JWK access key taken from the Laserfiche Developer Console
  // config page for your application.
  private _accessKey: AccessKey;
  private _tokenClient: TokenClient;
  private _accessToken: string | undefined;

  // The service principal key for the associated service principal user
  // for the application. You can configure service principals in
  // the Laserfiche Account Administration page under
  // "Service Principals"
  private _servicePrincipalKey: string;

  private _scope: string | undefined;

  /**
   * Constructor
   * @param servicePrincipalKey The service principal key created for the service principal from the Laserfiche Account Administration.
   * @param accessKey The access key exported from the Laserfiche Developer Console.
   * @param scope Specifies the requested scopes for the authorization request. Scopes are case-sensitive and space-delimited.
   */
  public constructor(servicePrincipalKey: string, accessKey: AccessKey, scope?: string) {
    if (!servicePrincipalKey) throw new Error('Service principal key cannot be blank.');

    this._accessKey = accessKey;
    this._servicePrincipalKey = servicePrincipalKey;
    this._tokenClient = new TokenClient(this._accessKey.domain);
    this._scope = scope;
  }

  /**
   * Called to prepare the request to the API service.
   * @param url The HTTP url
   * @param request The HTTP request
   */
  async beforeFetchRequestAsync(url: string, request: RequestInit): Promise<BeforeFetchResult> {
    if (!this._accessToken) {
      let resp = await this._tokenClient.getAccessTokenFromServicePrincipal(this._servicePrincipalKey, this._accessKey, this._scope);
      if (resp?.access_token) this._accessToken = resp.access_token;
      else console.warn(`getAccessToken did not return a token. ${resp}`);
    }

    if (this._accessToken) (<any>request.headers)['Authorization'] = 'Bearer ' + this._accessToken;

    return {
      regionalDomain: this._accessKey.domain,
    };
  }

  /**
   * Called to handle the response from the API service.
   * @param url The HTTP url
   * @param response The HTTP response
   * @param request The HTTP request
   * @returns true if the request should be retried.
   */
  async afterFetchResponseAsync(url: string, response: Response, request: RequestInit): Promise<boolean> {
    if (response.status === 401) {
      this._accessToken = undefined;
      return true;
    }
    return false;
  }
}
