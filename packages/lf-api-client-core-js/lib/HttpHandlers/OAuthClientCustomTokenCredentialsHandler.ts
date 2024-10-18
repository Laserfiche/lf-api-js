// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { HttpRequestHandler } from './HttpRequestHandler.js';
import { BeforeFetchResult } from './BeforeFetchResult.js';
import { GetAccessTokenResponse } from '../OAuth/GetAccessTokenResponse.js';
import { JwtUtils } from '../../index.js';

export class OAuthClientCustomTokenCredentialsHandler
  implements HttpRequestHandler
{
  private _getAccessTokenAsyncFunc: () => Promise<GetAccessTokenResponse>;
  private _accessTokenInfo?: { accessToken: string; regionalDomain: string };

  /**
   * Constructor
   * @param servicePrincipalKey The service principal key created for the service principal from the Laserfiche Account Administration.
   * @param accessKey The access key exported from the Laserfiche Developer Console.
   * @param scope Specifies the requested scopes for the authorization request. Scopes are case-sensitive and space-delimited.
   */
  public constructor(
    getAccessTokenAsync: () => Promise<GetAccessTokenResponse>
  ) {
    this._getAccessTokenAsyncFunc = getAccessTokenAsync;
  }

  /**
   * Called to prepare the request to the API service.
   * @param url The HTTP url
   * @param request The HTTP request
   */
  async beforeFetchRequestAsync(
    url: string,
    request: RequestInit
  ): Promise<BeforeFetchResult> {
    if (!this._accessTokenInfo) {
      try {
        let resp = await this._getAccessTokenAsyncFunc();
        if (resp?.access_token) {
          const jwt = JwtUtils.parseAccessToken(resp.access_token);
          const regionalDomain = JwtUtils.getAudFromLfJWT(jwt);
          this._accessTokenInfo = {
            accessToken: resp.access_token,
            regionalDomain,
          };
        } else {
          throw Error(`Invalid or missing access token, returned: ${resp}`);
        }
      }
      catch (err: any) {
        throw Error(`Invalid or missing access token: ${err.message}`);
      }
    }

    if (this._accessTokenInfo) {
      (<any>request.headers)['Authorization'] = 'Bearer ' + this._accessTokenInfo.accessToken;

      return {
        regionalDomain: this._accessTokenInfo.regionalDomain,
      };
    } else {
      throw Error('Missing access token');
    }
  }

  /**
   * Called to handle the response from the API service.
   * @param url The HTTP url
   * @param response The HTTP response
   * @param request The HTTP request
   * @returns true if the request should be retried.
   */
  async afterFetchResponseAsync(
    url: string,
    response: Response,
    request: RequestInit
  ): Promise<boolean> {
    if (response.status === 401) {
      this._accessTokenInfo = undefined;
      return true;
    }
    return false;
  }
}
