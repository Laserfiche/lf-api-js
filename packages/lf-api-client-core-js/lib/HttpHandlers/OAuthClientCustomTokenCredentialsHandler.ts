// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { HttpRequestHandler } from './HttpRequestHandler.js';
import { BeforeFetchResult } from './BeforeFetchResult.js';
import { GetAccessTokenResponse } from '../OAuth/GetAccessTokenResponse.js';
import * as JwtUtils from '../utils/JwtUtils.js';

export class OAuthClientCustomTokenCredentialsHandler
  implements HttpRequestHandler
{
  private _getAccessTokenAsyncFunc: () => Promise<GetAccessTokenResponse>;
  private _accessToken: string | undefined;

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
    if (!this._accessToken) {
      let resp = await this._getAccessTokenAsyncFunc();
      if (resp?.access_token) this._accessToken = resp.access_token;
      else console.warn(`getAccessToken did not return a token. ${resp}`);
    }

    if (this._accessToken) {
      (<any>request.headers)['Authorization'] = 'Bearer ' + this._accessToken;

      return {
        regionalDomain: JwtUtils.getAudFromLfJWT(
          JwtUtils.parseAccessToken(this._accessToken)
        ),
      };
    } else {
      throw Error("Unexpected, no access token.");
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
      this._accessToken = undefined;
      return true;
    }
    return false;
  }
}
