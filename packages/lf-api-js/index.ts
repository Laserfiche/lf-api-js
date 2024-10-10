// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import {
  UsernamePasswordHandler,
  OAuthClientCredentialsHandler,
  OAuthClientCustomTokenCredentialsHandler,
  HttpRequestHandler,
  AccessKey,
  GetAccessTokenResponse,
} from '@laserfiche/lf-api-client-core';
import { StringUtils } from '@laserfiche/lf-js-utils';

import * as LfRepositoryClientV1 from '@laserfiche/lf-repository-api-client';
import * as LfRepositoryClientV2 from '@laserfiche/lf-repository-api-client-v2';

export { LfRepositoryClientV1, LfRepositoryClientV2 };

export interface ILfApiClient {
  repositoryApiClientV1: LfRepositoryClientV1.IRepositoryApiClient;
  repositoryApiClientV2: LfRepositoryClientV2.IRepositoryApiClient;
}

// @ts-ignore
export class LfApiClient implements ILfApiClient {
  public repositoryApiClientV1: LfRepositoryClientV1.IRepositoryApiClient;
  public repositoryApiClientV2: LfRepositoryClientV2.IRepositoryApiClient;

  private constructor(
    httpRequestHandler: HttpRequestHandler,
    baseUrlDebug?: string
  ) {
    this.repositoryApiClientV1 = LfRepositoryClientV1.RepositoryApiClient.createFromHttpRequestHandler(
      httpRequestHandler,
      baseUrlDebug
    );
    
    this.repositoryApiClientV2 = LfRepositoryClientV2.RepositoryApiClient.createFromHttpRequestHandler(
      httpRequestHandler,
      baseUrlDebug
    );
  }

  /**
   * Create a Laserfiche API client.
   * @param httpRequestHandler The http request handler for the Laserfiche API client.
   * @param baseUrlDebug (optional) override for the Laserfiche repository API base url.
   */
  public static createFromHttpRequestHandler(
    httpRequestHandler: HttpRequestHandler,
    baseUrlDebug?: string
  ): ILfApiClient {
    if (!httpRequestHandler)
      throw new Error('Argument cannot be null: httpRequestHandler');
    const apiClient = new LfApiClient(httpRequestHandler, baseUrlDebug);
    return apiClient;
  }
  /**
   * Create a Laserfiche API client.
   * @param httpRequestHandler The http request handler for the Laserfiche API client.
   * @param baseUrlDebug (optional) override for the Laserfiche API base url.
   */
  public static createFromGetAccessTokenFunc(
    accessTokenFunc: () => Promise<GetAccessTokenResponse>,
    baseUrlDebug?: string
  ): ILfApiClient {
    const handler = new OAuthClientCustomTokenCredentialsHandler(
      accessTokenFunc
    );
    return LfApiClient.createFromHttpRequestHandler(handler, baseUrlDebug);
  }

  /**
   * Create a Laserfiche API client that will use Laserfiche Cloud OAuth client credentials to get access tokens.
   * @param servicePrincipalKey The service principal key created for the service principal from the Laserfiche Account Administration.
   * @param accessKey The access key exported from the Laserfiche Developer Console.
   * @param scope (optional) The requested space-delimited scopes for the access token.
   * @param baseUrlDebug (optional) override for the Laserfiche API base url.
   */
  public static createFromAccessKey(
    servicePrincipalKey: string,
    accessKey: AccessKey,
    scope?: string,
    baseUrlDebug?: string
  ): ILfApiClient {
    const handler = new OAuthClientCredentialsHandler(
      servicePrincipalKey,
      accessKey,
      scope
    );
    return LfApiClient.createFromHttpRequestHandler(handler, baseUrlDebug);
  }

  /**
   * Create a Laserfiche API client that will use username and password to get access tokens for Laserfiche API. Password credentials grant type is implemented by the Laserfiche Self-Hosted API server. Not available in cloud.
   * @param repositoryId The repository ID
   * @param username The username
   * @param password The password
   * @param baseUrl API server base URL e.g., https://{APIServerName}/LFRepositoryAPI
   */
  public static createFromUsernamePassword(
    repositoryId: string,
    username: string,
    password: string,
    baseUrl: string
  ): ILfApiClient {
    const baseUrlWithoutSlash: string = StringUtils.trimEnd(baseUrl, '/');
    const handler = new UsernamePasswordHandler(
      repositoryId,
      username,
      password,
      baseUrlWithoutSlash,
      undefined
    );
    return new LfApiClient(handler, baseUrlWithoutSlash);
  }
}
