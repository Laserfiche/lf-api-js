// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { AccessKey, createClientCredentialsAuthorizationJwt } from './AccessKey.js';
import { GetAccessTokenResponse } from './GetAccessTokenResponse.js';
import { getOauthTokenUrl } from '../utils/DomainUtils.js';
import { ProblemDetails } from '../ProblemDetails.js';
import { ApiException } from '../ApiException.js';
import { BaseTokenClient} from "../BaseTokenClient.js"

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
}

/**
 * An object to interact with the Laserfiche Cloud OAuth 2.0 token endpoint.
 */
export class TokenClient extends BaseTokenClient implements ITokenClient {
  private _accessTokenSPErrMsg: string = "Get access token error.";

  /**
   * Constructor for a TokenClient used to interact with the Laserfiche Cloud OAuth 2.0 token endpoint.
   * @param regionalDomainOrUrl - regional specific host, such as 'laserfiche.com', or 'eu.laserfiche.com' or it could be a full URL
   */
  constructor(regionalDomain: string) {
    super();
    this._baseUrl = getOauthTokenUrl(regionalDomain);
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
}
