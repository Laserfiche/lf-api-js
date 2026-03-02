// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { StringUtils } from '@laserfiche/lf-js-utils';
import { ApiException } from './ApiException';
import { GetAccessTokenResponse } from './OAuth/GetAccessTokenResponse';
import { ProblemDetails } from './ProblemDetails';

const CONTENT_TYPE_WWW_FORM_URLENCODED = 'application/x-www-form-urlencoded';

export interface IBaseTokenClient {
  /**
   * Gets an OAuth access token given an OAuth code
   * @param code - Authorization code
   * @param redirect_uri - Authorization endpoint redirect uri
   * @param client_id - OPTIONAL OAuth application client id
   * @param client_secret - OPTIONAL OAuth application client secret. Required for web apps.
   * @param code_verifier - OPTIONAL PKCE code verifier. Required for SPA apps.
   * @param scope - OPTIONAL The requested space-delimited scopes for the access token.
   */
  getAccessTokenFromCode(
    code: string,
    redirect_uri: string,
    client_id?: string,
    client_secret?: string,
    code_verifier?: string,
    scope?: string,
  ): Promise<GetAccessTokenResponse>;

  /**
   * Gets a refreshed access token given a refresh token
   * @param refresh_token - Refresh token
   * @param client_id - OPTIONAL OAuth application client id
   * @param client_secret - OPTIONAL OAuth application client secret. Required for web apps.
   */
  refreshAccessToken(
    refresh_token: string,
    client_id?: string,
    client_secret?: string,
  ): Promise<GetAccessTokenResponse>;
}

export class BaseTokenClient implements IBaseTokenClient {
  protected _baseUrl!: string;
  private _accessTokenCodeErrMsg: string = 'Get access token from code error.';
  private _refreshTokenErrMsg: string = 'Refresh access token error.';

  /**
   * Gets an OAuth access token given an OAuth code
   * @param code - Authorization code
   * @param redirect_uri - Authorization endpoint redirect uri
   * @param client_id - OPTIONAL OAuth application client id
   * @param client_secret - OPTIONAL OAuth application client secret. Required for web apps.
   * @param code_verifier - OPTIONAL PKCE code verifier. Required for SPA apps.
   * @param scope - OPTIONAL The requested space-delimited scopes for the access token.
   */
  async getAccessTokenFromCode(
    code: string,
    redirect_uri: string,
    client_id?: string,
    client_secret?: string,
    code_verifier?: string,
    scope?: string,
  ): Promise<GetAccessTokenResponse> {
    const request = this.createAuthorizationCodeTokenRequest(
      code,
      redirect_uri,
      client_id,
      code_verifier,
      client_secret,
      scope,
    );
    let url = this._baseUrl;
    const res: Response = await fetch(url, request);
    if (res.status === 200) {
      const getAccessTokenResponse = await res.json();
      return getAccessTokenResponse;
    } else if (res.headers.get('Content-Type')?.includes('json') === true) {
      const errorResponse = await res.json();
      const problemDetails = ProblemDetails.fromJS(errorResponse);
      const apiException = new ApiException(
        problemDetails.title ?? this._accessTokenCodeErrMsg,
        problemDetails.status,
        res.headers,
        problemDetails,
      );
      throw apiException;
    } else {
      throw new ApiException(
        this._accessTokenCodeErrMsg,
        res.status,
        res.headers,
        null,
      );
    }
  }

  /**
   * Gets a refreshed access token given a refresh token
   * @param refresh_token - Refresh token
   * @param client_id - OPTIONAL OAuth application client id
   * @param client_secret - OPTIONAL OAuth application client secret. Required for web apps.
   */
  async refreshAccessToken(
    refresh_token: string,
    client_id?: string,
    client_secret?: string,
  ): Promise<GetAccessTokenResponse> {
    const request = this.createRefreshTokenRequest(
      refresh_token,
      client_id,
      client_secret,
    );
    let url = this._baseUrl;
    const res: Response = await fetch(url, request);
    if (res.status === 200) {
      const getAccessTokenResponse = await res.json();
      return getAccessTokenResponse;
    } else if (res.headers.get('Content-Type')?.includes('json') === true) {
      const errorResponse = await res.json();
      const problemDetails = ProblemDetails.fromJS(errorResponse);
      const apiException = new ApiException(
        problemDetails.title ?? this._refreshTokenErrMsg,
        problemDetails.status,
        res.headers,
        problemDetails,
      );
      throw apiException;
    } else {
      throw new ApiException(
        this._refreshTokenErrMsg,
        res.status,
        res.headers,
        null,
      );
    }
  }

  private createAuthorizationCodeTokenRequest(
    code: string,
    redirect_uri: string,
    client_id?: string,
    code_verifier?: string,
    client_secret?: string,
    scope?: string,
  ): RequestInit {
    const request: RequestInit = { method: 'POST' };
    const headers = this.getPostRequestHeaders(client_id, client_secret);
    const body: any = {
      grant_type: 'authorization_code',
      code,
      redirect_uri,
      client_id,
    };
    if (code_verifier) {
      body['code_verifier'] = code_verifier;
    }
    if (scope) {
      body['scope'] = scope;
    }
    const requestBody = this.objToWWWFormUrlEncodedBody(body);
    request.headers = headers;
    request.body = requestBody;
    return request;
  }

  private createRefreshTokenRequest(
    refreshToken: string,
    client_id?: string,
    client_secret?: string,
  ): RequestInit {
    const request: RequestInit = { method: 'POST' };
    const headers = this.getPostRequestHeaders(client_id, client_secret);
    let body: any = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id,
    };
    const requestBody = this.objToWWWFormUrlEncodedBody(body);
    request.headers = headers;
    request.body = requestBody;
    return request;
  }

  protected getPostRequestHeaders(client_id?: string, client_secret?: string) {
    const headers: Record<string, string> = {
      'Content-Type': CONTENT_TYPE_WWW_FORM_URLENCODED,
    };
    if (client_secret) {
      const basicCredentials = client_id + ':' + client_secret;
      const encodedClientSecret = StringUtils.stringToBase64(basicCredentials);
      headers['Authorization'] = 'Basic ' + encodedClientSecret;
    }
    return headers;
  }

  protected objToWWWFormUrlEncodedBody(obj: any): string {
    const urlSearchParams = new URLSearchParams();
    for (const i in obj) {
      urlSearchParams.set(i, obj[i]);
    }
    return urlSearchParams.toString();
  }
}
