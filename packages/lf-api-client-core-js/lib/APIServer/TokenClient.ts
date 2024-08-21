// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { CreateConnectionRequest } from './CreateConnectionRequest.js';
import { SessionKeyInfo } from './SessionKeyInfo.js';
import { HTTPError } from '../HttpError.js';
import { ProblemDetails } from '../ProblemDetails.js';
import { ApiException } from '../ApiException.js';

export interface ITokenClient {
  /**
   * Gets the Laserfiche Self-Hosted access token
   * @param repositoryId Repository name
   * @param body   Request body that contains username, password and grant type
   * @return Create an access token successfully.
   */
  createAccessToken(repositoryId: string, body: CreateConnectionRequest): Promise<SessionKeyInfo>;
}

export class TokenClient implements ITokenClient{
  private _baseUrl: string;
  private _createAccessTokenErrMsg: string = "Get access token error.";

  /**
   * Constructor for a TokenClient used to interact with the Laserfiche Self-Hosted token endpoint.
   * @param baseUrl APIServer Base Url e.g. https://{APIServerName}/LFRepositoryAPI
   */
  constructor(baseUrl: string) {
    if (!baseUrl) throw new Error('baseUrl is undefined.');
    this._baseUrl = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
  }

  async createAccessToken(repositoryId: string, body: CreateConnectionRequest): Promise<SessionKeyInfo> {
    const encodedGrantType = body.grant_type ? encodeURIComponent(body.grant_type) : '';
    const encodedUsername = body.username ? encodeURIComponent(body.username) : '';
    const encodedPassword = body.password ? encodeURIComponent(body.password) : '';
    const req: RequestInit = {
        method: 'POST',
        headers: new Headers({
          'content-type': 'application/x-www-form-urlencoded',
          'accept': 'application/json'
        }),
        body: `grant_type=${encodedGrantType}&username=${encodedUsername}&password=${encodedPassword}`,
      };
      const url = this._baseUrl + `/v1/Repositories/${encodeURIComponent(repositoryId)}/Token`;
      const res: Response = await fetch(url, req);
      if (res.status === 200) {
        const getAccessTokenResponse = await res.json();
        return getAccessTokenResponse;
      } else if (res.headers.get('Content-Type')?.includes('json') === true) {
        const errorResponse = await res.json();
        const problemDetails = ProblemDetails.fromJS(errorResponse);
        const apiException = new ApiException(problemDetails.title ?? this._createAccessTokenErrMsg,
                                               problemDetails.status, res.headers, problemDetails);
        throw apiException;
      } else {
        throw new ApiException(this._createAccessTokenErrMsg, res.status, res.headers, null);
      }
  }
}
