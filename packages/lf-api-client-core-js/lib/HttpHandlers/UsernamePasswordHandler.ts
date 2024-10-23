// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { CreateConnectionRequest } from '../APIServer/CreateConnectionRequest.js';
import { ITokenClient, TokenClient } from '../APIServer/TokenClient.js';
import { BeforeFetchResult } from './BeforeFetchResult.js';
import { HttpRequestHandler } from './HttpRequestHandler.js';

const GRANT_TYPE: string = 'password';
export class UsernamePasswordHandler implements HttpRequestHandler {
  private _accessToken: string | undefined;
  private _repositoryId: string;
  private _baseUrl: string;
  private _client: ITokenClient;
  private _request: CreateConnectionRequest;

  /**
   * Creates a username and password authorization handler for Laserfiche Self-Hosted API server
   *
   * @param repositoryId - Repository name
   * @param username -     The username used with "password" grant type.
   * @param password -     The password used with "password" grant type.
   * @param baseUrl -      APIServer Base Url e.g. https://{APIServerName}/LFRepositoryAPI
   * @param client -       OPTIONAL
   */
  constructor(
    repositoryId: string,
    username: string,
    password: string,
    baseUrl: string,
    client?: ITokenClient
  ) {
    this._baseUrl = baseUrl;
    this._repositoryId = repositoryId;
    this._request = {
      grant_type: GRANT_TYPE,
      username: username,
      password: password,
    };
    if (!client) {
      this._client = new TokenClient(this._baseUrl ?? '');
    } else {
      this._client = client;
    }
  }

  /**
   * Called to prepare the request to the API service.
   * @param url - The HTTP url
   * @param request - The HTTP request
   */
  async beforeFetchRequestAsync(url: string, request: RequestInit): Promise<BeforeFetchResult> {
    if (!this._accessToken) {
      let resp = await this._client.createAccessToken(this._repositoryId, this._request);
      if (resp?.access_token) {
        this._accessToken = resp.access_token;
      } else {
        console.warn(`createAccessToken did not return a token. ${resp}`);
      }
    }
    if (this._accessToken) {
      if (!request.headers) {
        request.headers = {};
      }
      (<any>request.headers)['Authorization'] = 'Bearer ' + this._accessToken;
    }
    return {
      regionalDomain: this._baseUrl,
    };
  }

  /**
   * Called to handle the response from the API service.
   * @param url - The HTTP url
   * @param response - The HTTP response
   * @param request - The HTTP request
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
