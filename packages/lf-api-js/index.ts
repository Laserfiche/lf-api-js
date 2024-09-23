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

import {
  IRepositoryApiClient,
  RepositoryApiClient,
} from '@laserfiche/lf-repository-api-client-v2';

export interface ILfApiClient {
  repositoryApiClient: IRepositoryApiClient;
}

// @ts-ignore
export class LfAPIClient implements ILfApiClient {
  public repositoryApiClient: IRepositoryApiClient;

  private constructor(
    httpRequestHandler: HttpRequestHandler,
    baseUrlDebug?: string
  ) {
    this.repositoryApiClient = RepositoryApiClient.createFromHttpRequestHandler(
      httpRequestHandler,
      baseUrlDebug
    );
  }

  /**
   * Create a Laserfiche repository client.
   * @param httpRequestHandler The http request handler for the Laserfiche repository client.
   * @param baseUrlDebug (optional) override for the Laserfiche repository API base url.
   */
  public static createFromHttpRequestHandler(
    httpRequestHandler: HttpRequestHandler,
    baseUrlDebug?: string
  ): ILfApiClient | undefined {
    if (!httpRequestHandler)
      throw new Error('Argument cannot be null: httpRequestHandler');
    const apiClient = new LfAPIClient(httpRequestHandler, baseUrlDebug);
    return apiClient;
  }
  /**
   * Create a Laserfiche repository client.
   * @param httpRequestHandler The http request handler for the Laserfiche repository client.
   * @param baseUrlDebug (optional) override for the Laserfiche repository API base url.
   */
  public static createFromGetAccessTokenFunc(
    accessTokenFunc: () => Promise<GetAccessTokenResponse>,
    baseUrlDebug?: string
  ): ILfApiClient | undefined {
    const handler = new OAuthClientCustomTokenCredentialsHandler(
      accessTokenFunc
    );
    return LfAPIClient.createFromHttpRequestHandler(handler, baseUrlDebug);
  }

  /**
   * Create a Laserfiche repository client that will use Laserfiche Cloud OAuth client credentials to get access tokens.
   * @param servicePrincipalKey The service principal key created for the service principal from the Laserfiche Account Administration.
   * @param accessKey The access key exported from the Laserfiche Developer Console.
   * @param scope (optional) The requested space-delimited scopes for the access token.
   * @param baseUrlDebug (optional) override for the Laserfiche repository API base url.
   */
  public static createFromAccessKey(
    servicePrincipalKey: string,
    accessKey: AccessKey,
    scope?: string,
    baseUrlDebug?: string
  ): ILfApiClient | undefined {
    const handler = new OAuthClientCredentialsHandler(
      servicePrincipalKey,
      accessKey,
      scope
    );
    return LfAPIClient.createFromHttpRequestHandler(handler, baseUrlDebug);
  }

  /**
   * Create a Laserfiche repository client that will use username and password to get access tokens for Laserfiche API. Password credentials grant type is implemented by the Laserfiche Self-Hosted API server. Not available in cloud.
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
  ): ILfApiClient | undefined {
    const baseUrlWithoutSlash: string = StringUtils.trimEnd(baseUrl, '/');
    const handler = new UsernamePasswordHandler(
      repositoryId,
      username,
      password,
      baseUrlWithoutSlash,
      undefined
    );
    return new LfAPIClient(handler, baseUrlWithoutSlash);
  }
}
