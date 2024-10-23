// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { AccessKey, createClientCredentialsAuthorizationJwt } from './AccessKey.js';
import { GetAccessTokenResponse } from './GetAccessTokenResponse.js';
import { getOauthTokenUrl } from '../utils/DomainUtils.js';
import { HTTPError } from '../HttpError.js';
import { StringUtils } from '@laserfiche/lf-js-utils';
import { ProblemDetails } from '../ProblemDetails.js';
import { ApiException } from '../ApiException.js';

const CONTENT_TYPE_WWW_FORM_URLENCODED = 'application/x-www-form-urlencoded';

/**
 * An object to interact with the Laserfiche Cloud OAuth 2.0 token endpoint.
 */
export interface ITokenClient {
  /**
   * Gets an OAuth access token given a Laserfiche cloud service principal key and an OAuth service application access key.
   * @param servicePrincipalKey - Laserfiche cloud service principal key
   * @param accessKey - OAuth service application access key
   * @param scope - OPTIONAL The requested space-delimited scopes for the access token.
   */
  getAccessTokenFromServicePrincipal(
    servicePrincipalKey: string,
    accessKey: AccessKey,
    scope?: string
  ): Promise<GetAccessTokenResponse>;

  /**
   * Gets an OAuth access token given an OAuth code
   * @param code - Authorization code
   * @param redirect_uri - Authorization endpoint redirect uri
   * @param client_id - OAuth application client id
   * @param client_secret - OPTIONAL OAuth application client secret. Required for web apps.
   * @param code_verifier - OPTIONAL PKCE code verifier. Required for SPA apps.
   * @param scope - OPTIONAL The requested space-delimited scopes for the access token.
   */
  getAccessTokenFromCode(
    code: string,
    redirect_uri: string,
    client_id: string,
    client_secret?: string,
    code_verifier?: string,
    scope?: string
  ): Promise<GetAccessTokenResponse>;

  /**
   * Gets a refreshed access token given a refresh token
   * @param refresh_token - Refresh token
   * @param client_id - OAuth application client id
   * @param client_secret - OPTIONAL OAuth application client secret. Required for web apps.
   */
  refreshAccessToken(refresh_token: string, client_id: string, client_secret?: string): Promise<GetAccessTokenResponse>;
}

/**
 * An object to interact with the Laserfiche Cloud OAuth 2.0 token endpoint.
 */
export class TokenClient implements ITokenClient {
  private _baseUrl: string;
  private _accessTokenSPErrMsg: string = "Get access token error.";
  private _refreshTokenErrMsg: string = "Refresh access token error.";
  private _acessTokenCodeErrMsg: string = "Get access token from code error.";

  /**
   * Constructor for a TokenClient used to interact with the Laserfiche Cloud OAuth 2.0 token endpoint.
   * @param regionalDomain - regional specific host, such as 'laserfiche.com', or 'eu.laserfiche.com'
   */
  constructor(regionalDomain: string) {
    this._baseUrl = getOauthTokenUrl(regionalDomain);
  }

  /**
   * Gets a refreshed access token given a refresh token
   * @param refresh_token - Refresh token
   * @param client_id - OAuth application client id
   * @param client_secret - OPTIONAL OAuth application client secret. Required for web apps.
   */
  async refreshAccessToken(
    refresh_token: string,
    client_id: string,
    client_secret?: string
  ): Promise<GetAccessTokenResponse> {
    const request = this.createRefreshTokenRequest(refresh_token, client_id, client_secret);
    let url = this._baseUrl;
    const res: Response = await fetch(url, request);
    if (res.status === 200) {
      const getAccessTokenResponse = await res.json();
      return getAccessTokenResponse;
    } else if (res.headers.get('Content-Type')?.includes('json') === true) {
      const errorResponse = await res.json();
      const problemDetails = ProblemDetails.fromJS(errorResponse);
      const apiException = new ApiException(problemDetails.title ?? this._refreshTokenErrMsg,
                                             problemDetails.status, res.headers, problemDetails);
      throw apiException;
    } else {
      throw new ApiException(this._refreshTokenErrMsg, res.status, res.headers, null);
    }
  }

  /**
   * Gets an OAuth access token given an OAuth code
   * @param code - Authorization code
   * @param redirect_uri - Authorization endpoint redirect uri
   * @param client_id - OAuth application client id
   * @param client_secret - OPTIONAL OAuth application client secret. Required for web apps.
   * @param code_verifier - OPTIONAL PKCE code verifier. Required for SPA apps.
   * @param scope - OPTIONAL The requested space-delimited scopes for the access token.
   */
  async getAccessTokenFromCode(
    code: string,
    redirect_uri: string,
    client_id: string,
    client_secret?: string,
    code_verifier?: string,
    scope?: string
  ): Promise<GetAccessTokenResponse> {
    const request = this.createAuthorizationCodeTokenRequest(
      code,
      redirect_uri,
      client_id,
      code_verifier,
      client_secret,
      scope
    );
    let url = this._baseUrl;
    const res: Response = await fetch(url, request);
    if (res.status === 200) {
      const getAccessTokenResponse = await res.json();
      return getAccessTokenResponse;
    } else if (res.headers.get('Content-Type')?.includes('json') === true) {
      const errorResponse = await res.json();
      const problemDetails = ProblemDetails.fromJS(errorResponse);
      const apiException = new ApiException(problemDetails.title ?? this._acessTokenCodeErrMsg,
                                             problemDetails.status, res.headers, problemDetails);
      throw apiException;
    } else {
      throw new ApiException(this._acessTokenCodeErrMsg, res.status, res.headers, null);
    }
  }

  /**
   * Gets an OAuth access token given a Laserfiche cloud service principal key and an OAuth service application access key.
   * @param servicePrincipalKey - Laserfiche cloud service principal key
   * @param accessKey - OAuth service application access key
   * @param scope - OPTIONAL The requested space-delimited scopes for the access token.
   */
  async getAccessTokenFromServicePrincipal(
    servicePrincipalKey: string,
    accessKey: AccessKey,
    scope?: string
  ): Promise<GetAccessTokenResponse> {
    const token = createClientCredentialsAuthorizationJwt(servicePrincipalKey, accessKey);

    let body = `grant_type=client_credentials`;
    if (scope) {
      body += `&scope=${encodeURIComponent(scope)}`;
    }

    const req: RequestInit = {
      method: 'POST',
      headers: new Headers({
        'content-type': 'application/x-www-form-urlencoded',
        withCredentials: 'true',
        credentials: 'include',
        Authorization: `Bearer ${token}`,
      }),
      body: body
    };

    const url = this._baseUrl;
    const res: Response = await fetch(url, req);
    if (res.status === 200) {
      const getAccessTokenResponse = await res.json();
      return getAccessTokenResponse;
    } else if (res.headers.get('Content-Type')?.includes('json') === true) {
      const errorResponse = await res.json();
      const problemDetails = ProblemDetails.fromJS(errorResponse);
      const apiException = new ApiException(problemDetails.title ?? this._accessTokenSPErrMsg,
                                             problemDetails.status, res.headers, problemDetails);
      throw apiException;
    } else {
      throw new ApiException(this._accessTokenSPErrMsg, res.status, res.headers, null);
    }
  }

  private createAuthorizationCodeTokenRequest(
    code: string,
    redirect_uri: string,
    client_id: string,
    code_verifier?: string,
    client_secret?: string,
    scope?: string
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

  private createRefreshTokenRequest(refreshToken: string, client_id: string, client_secret?: string): RequestInit {
    const request: RequestInit = { method: 'POST' };
    const headers = this.getPostRequestHeaders(client_id, client_secret);
    let body: any= {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id
    };
    const requestBody = this.objToWWWFormUrlEncodedBody(body);
    request.headers = headers;
    request.body = requestBody;
    return request;
  }

  private getPostRequestHeaders(client_id: string, client_secret?: string) {
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

  private objToWWWFormUrlEncodedBody(obj: any): string {
    const urlSearchParams = new URLSearchParams();
    for (const i in obj) {
      urlSearchParams.set(i, obj[i]);
    }
    return urlSearchParams.toString();
  }
}
