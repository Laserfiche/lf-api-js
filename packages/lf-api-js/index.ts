// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import {
    UsernamePasswordHandler,
    OAuthClientCredentialsHandler,
    OAuthClientCustomTokenCredentialsHandler,
    HttpRequestHandler,
    DomainUtils,
    AccessKey,
    ApiException as ApiExceptionCore,
    GetAccessTokenResponse
  } from '@laserfiche/lf-api-client-core';
  import { StringUtils } from '@laserfiche/lf-js-utils';

  import {IRepositoryApiClient, RepositoryApiClientHttpHandler, RepositoryApiClient} from '@laserfiche/lf-repository-api-client-v2';
export interface ILfApiClient {
    repositoryApiClient: IRepositoryApiClient;
  }
  
  // @ts-ignore
  export class LfAPIClient implements ILfApiClient {
    private baseUrl: string;
  
    public repositoryApiClient: IRepositoryApiClient;
  
    private repoClientHandler: RepositoryApiClientHttpHandler;
  
    /**
     * Get the headers which will be sent with each request.
     */
    public get defaultRequestHeaders(): Record<string, string> {
      return this.repoClientHandler.defaultRequestHeaders;
    }
  
    /**
     * Set the headers which will be sent with each request.
     */
    public set defaultRequestHeaders(headers: Record<string, string>) {
      this.repoClientHandler.defaultRequestHeaders = headers;
    }
  
    private constructor(httpRequestHandler: HttpRequestHandler, baseUrlDebug?: string) {
      this.repoClientHandler = new RepositoryApiClientHttpHandler(httpRequestHandler);
      this.repositoryApiClient = RepositoryApiClient.createFromHttpRequestHandler(httpRequestHandler);
      if (this.repoClientHandler){
        this.defaultRequestHeaders['Accept-Encoding'] = 'gzip';
      }
      let fetch = this.repoClientHandler.httpHandler;
      fetch = fetch.bind(this.repoClientHandler);
      let http = {
        fetch,
      };
      this.baseUrl = baseUrlDebug ?? ''; 
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
      if (!httpRequestHandler) throw new Error('Argument cannot be null: httpRequestHandler');
      // const repoClient = new RepositoryApiClient(httpRequestHandler, baseUrlDebug);
      return undefined;
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
      const handler = new OAuthClientCustomTokenCredentialsHandler(accessTokenFunc);
      // return RepositoryApiClient.createFromHttpRequestHandler(handler, baseUrlDebug);
      return undefined;
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
      const handler = new OAuthClientCredentialsHandler(servicePrincipalKey, accessKey, scope);
      // return RepositoryApiClient.createFromHttpRequestHandler(handler, baseUrlDebug);
      return undefined;
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
      const handler = new UsernamePasswordHandler(repositoryId, username, password, baseUrlWithoutSlash, undefined);
      // return new RepositoryApiClient(handler, baseUrlWithoutSlash);
      return undefined;
    }
  }