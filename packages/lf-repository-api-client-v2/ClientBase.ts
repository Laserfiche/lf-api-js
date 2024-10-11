// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import * as generated from './index.js';
import { UrlUtils, StringUtils } from '@laserfiche/lf-js-utils';
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
class ClientBase {}
export interface IRepositoryApiClient {
  attributesClient: IAttributesClient;
  auditReasonsClient: generated.IAuditReasonsClient;
  entriesClient: IEntriesClient;
  fieldDefinitionsClient: IFieldDefinitionsClient;
  repositoriesClient: generated.IRepositoriesClient;
  searchesClient: ISearchesClient;
  simpleSearchesClient: generated.ISimpleSearchesClient;
  tagDefinitionsClient: ITagDefinitionsClient;
  tasksClient: generated.ITasksClient;
  templateDefinitionsClient: ITemplateDefinitionsClient;
  linkDefinitionsClient: ILinkDefinitionsClient;
  defaultRequestHeaders: Record<string, string>;
}

// @ts-ignore
export class RepositoryApiClient implements IRepositoryApiClient {
  private baseUrl: string;

  public attributesClient: IAttributesClient;
  public auditReasonsClient: generated.IAuditReasonsClient;
  public entriesClient: IEntriesClient;
  public fieldDefinitionsClient: IFieldDefinitionsClient;
  public repositoriesClient: generated.IRepositoriesClient;
  public searchesClient: ISearchesClient;
  public simpleSearchesClient: generated.ISimpleSearchesClient;
  public tagDefinitionsClient: ITagDefinitionsClient;
  public tasksClient: generated.ITasksClient;
  public templateDefinitionsClient: ITemplateDefinitionsClient;
  public linkDefinitionsClient: ILinkDefinitionsClient;

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
    if (this.repoClientHandler){
      this.defaultRequestHeaders['Accept-Encoding'] = 'gzip';
    }
    let fetch = this.repoClientHandler.httpHandler;
    fetch = fetch.bind(this.repoClientHandler);
    let http = {
      fetch,
    };
    this.baseUrl = baseUrlDebug ?? '';
    this.attributesClient = new AttributesClient(this.baseUrl, http);
    this.auditReasonsClient = new generated.AuditReasonsClient(this.baseUrl, http);
    this.entriesClient = new EntriesClient(this.baseUrl, http);
    this.fieldDefinitionsClient = new FieldDefinitionsClient(this.baseUrl, http);
    this.repositoriesClient = new generated.RepositoriesClient(this.baseUrl, http);
    this.searchesClient = new SearchesClient(this.baseUrl, http);
    this.simpleSearchesClient = new generated.SimpleSearchesClient(this.baseUrl, http);
    this.tagDefinitionsClient = new TagDefinitionsClient(this.baseUrl, http);
    this.tasksClient = new generated.TasksClient(this.baseUrl, http);
    this.templateDefinitionsClient = new TemplateDefinitionsClient(this.baseUrl, http);
    this.linkDefinitionsClient = new LinkDefinitionsClient(this.baseUrl, http);
  }

  /**
   * Create a Laserfiche repository client.
   * @param httpRequestHandler The http request handler for the Laserfiche repository client.
   * @param baseUrlDebug (optional) override for the Laserfiche repository API base url.
   */
  public static createFromHttpRequestHandler(
    httpRequestHandler: HttpRequestHandler,
    baseUrlDebug?: string
  ): RepositoryApiClient {
    if (!httpRequestHandler) throw new Error('Argument cannot be null: httpRequestHandler');
    const repoClient = new RepositoryApiClient(httpRequestHandler, baseUrlDebug);
    return repoClient;
  }
  /**
   * Create a Laserfiche repository client.
   * @param httpRequestHandler The http request handler for the Laserfiche repository client.
   * @param baseUrlDebug (optional) override for the Laserfiche repository API base url.
   */
  public static createFromGetAccessTokenFunc(
    accessTokenFunc: () => Promise<GetAccessTokenResponse>,
    baseUrlDebug?: string
  ): RepositoryApiClient {
    const handler = new OAuthClientCustomTokenCredentialsHandler(accessTokenFunc);
    return RepositoryApiClient.createFromHttpRequestHandler(handler, baseUrlDebug);
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
  ): RepositoryApiClient {
    const handler = new OAuthClientCredentialsHandler(servicePrincipalKey, accessKey, scope);
    return RepositoryApiClient.createFromHttpRequestHandler(handler, baseUrlDebug);
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
  ): RepositoryApiClient {
    const baseUrlWithoutSlash: string = StringUtils.trimEnd(baseUrl, '/');
    const handler = new UsernamePasswordHandler(repositoryId, username, password, baseUrlWithoutSlash, undefined);
    return new RepositoryApiClient(handler, baseUrlWithoutSlash);
  }
}
/** @internal */
export class RepositoryApiClientHttpHandler {
  private _httpRequestHandler: HttpRequestHandler;
  public defaultRequestHeaders: Record<string, string>;

  constructor(httpRequestHandler: HttpRequestHandler) {
    this._httpRequestHandler = httpRequestHandler;
    this.defaultRequestHeaders = {};
  }

  public async httpHandler(url: string, init: RequestInit): Promise<Response> {
    const maxRetries = 1;
    let retryCount = 0;
    let shouldRetry = true;

    if (this.defaultRequestHeaders) {
      init.headers = Object.assign({}, this.defaultRequestHeaders, init.headers);
    }
    let response: Response | undefined;
    while (retryCount <= maxRetries && shouldRetry) {
      const beforeSendResult = await this._httpRequestHandler.beforeFetchRequestAsync(url, init);
      let absoluteUrl: string;
      if (url.startsWith('http')) {
        absoluteUrl = url;
      } else {
        const apiBasedAddress = DomainUtils.getRepositoryEndpoint(beforeSendResult.regionalDomain);
        absoluteUrl = UrlUtils.combineURLs(apiBasedAddress, url);
      }

      try {
        response = await fetch(absoluteUrl, init);
        shouldRetry =
          (await this._httpRequestHandler.afterFetchResponseAsync(absoluteUrl, response, init)) ||
          isRetryable(response, init);
        if (!shouldRetry) {
          return response;
        }
      } catch (err) {
        if (retryCount >= maxRetries) {
          throw err;
        }
        shouldRetry = true;
        console.warn(`Retrying fetch due to exception: ${err}`);
      } finally {
        retryCount++;
      }
    }
    if (!response) {
      throw new Error('Undefined response, there is a bug!');
    }
    return response;
  }
}

function isRetryable(response: Response, init: RequestInit): boolean {
  const isIdempotent = init.method != 'POST';
  return (response.status >= 500 || response.status == 408) && isIdempotent;
}

async function getNextLinkListing<T>(
  http: { fetch(url: RequestInfo, init?: RequestInit): Promise<Response> },
  processListing: (response: Response) => Promise<T>,
  nextLink: string,
  maxPageSize?: number
): Promise<T> {
  if (!nextLink) {
    throw new Error('Next Link is undefined');
  }
  const prefer = createMaxPageSizePreferHeaderPayload(maxPageSize);
  const options_ = <RequestInit>{
    method: 'GET',
    headers: {
      Prefer: prefer !== undefined && prefer !== null ? prefer : '',
      Accept: 'application/json',
    },
  };
  const processListingTwo = processListing.bind(http);

  const resp = await http.fetch(nextLink, options_);
  return await processListingTwo(resp);
}

function createMaxPageSizePreferHeaderPayload(maxSize?: number): string | undefined {
  //puts the max size into the prefer header of the GET request
  if (!maxSize) {
    return undefined;
  } else {
    return `maxpagesize=${maxSize}`;
  }
}

export interface IAttributesClient {
  /**
   * It will continue to make the same call to get a list of attributes key value pairs of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.IAttributesClient.listAttributes listAttributes}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.everyone (optional) Boolean value that indicates whether to return attributes key value pairs associated with everyone or the currently authenticated user.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of attributes key value pairs allowed per API response schema
   */
  listAttributesForEach(args: {
    callback: (response: generated.AttributeCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    everyone?: boolean;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void>;

  /**
   * Returns the attribute key value pairs using a next link
   * - Related: {@link generated.IAttributesClient.listAttributes listAttributes}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of attribute keys allowed per API response schema
   * @return A collection of attributes associated with the authenticated user.
   */
  listAttributesNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.AttributeCollectionResponse>;
}

export class AttributesClient extends generated.AttributesClient implements IAttributesClient {
  /**
   * It will continue to make the same call to get a list of attributes key value pairs of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.IAttributesClient.listAttributes listAttributes}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.everyone (optional) Boolean value that indicates whether to return attributes key value pairs associated with everyone or the currently authenticated user.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of attributes key value pairs allowed per API response schema
   */
  async listAttributesForEach(args: {
    callback: (response: generated.AttributeCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    everyone?: boolean;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repositoryId, everyone, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.listAttributes({
      repositoryId,
      everyone,
      prefer: createMaxPageSizePreferHeaderPayload(maxPageSize),
      select,
      orderby,
      top,
      skip,
      count,
    });
    let nextLink = response.odataNextLink;
    while ((await callback(response)) && nextLink) {
      response = await getNextLinkListing<generated.AttributeCollectionResponse>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processListAttributes,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * Returns the attribute key value pairs using a next link
   * - Related: {@link generated.IAttributesClient.listAttributes listAttributes}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection.
   * @param args.maxPageSize (optional) the maximum page size or number of attribute keys allowed per API response schema.
   * @return A collection of attributes associated with the authenticated user.
   */
  async listAttributesNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.AttributeCollectionResponse> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.AttributeCollectionResponse>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processListAttributes,
      nextLink,
      maxPageSize
    );
  }
}

export interface IEntriesClient {
  /**
   * It will continue to make the same call to get a list of entry listings of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.IEntriesClient.listEntries listEntries}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.entryId The requested entry ID.
   * @param args.groupByEntryType (optional) An optional query parameter used to indicate if the result should be grouped by entry type or not.
   * @param args.fields (optional) Optional array of field names. Field values corresponding to the given field names will be returned for each entry.
   * @param args.formatFieldValues (optional) Boolean for if field values should be formatted. Only applicable if Fields are specified.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFieldValues query parameter must be set to true, otherwise
          culture will not be used for formatting. 
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of entry listings allowed per API response schema.
   */
  listEntriesForEach(args: {
    callback: (response: generated.EntryCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    entryId: number;
    groupByEntryType?: boolean;
    fields?: string[];
    formatFieldValues?: boolean;
    prefer?: string;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void>;
  /**
   * It will continue to make the same call to get a list of field values of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.IEntriesClient.listFields listFields}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.entryId The requested entry ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.formatFieldValues (optional) An optional query parameter used to indicate if the field values should be formatted.
          The default value is false. 
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFieldValues query parameter must be set to true, otherwise
          culture will not be used for formatting. 
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of field values allowed per API response schema.
   */
  listFieldsForEach(args: {
    callback: (response: generated.FieldCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    entryId: number;
    prefer?: string;
    formatFieldValues?: boolean;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void>;
  /**
   * It will continue to make the same call to get a list of link values from entry of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.IEntriesClient.listLinks listLinks}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.entryId The requested entry ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of link values from entry allowed per API response schema.
   */
  listLinksForEach(args: {
    callback: (response: generated.LinkCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    entryId: number;
    prefer?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void>;
  /**
   * It will continue to make the same call to get a list of tags assigned to entry of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.IEntriesClient.listTags listTags}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.entryId The requested entry ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of tags assigned to entry allowed per API response schema.
   */
  listTagsForEach(args: {
    callback: (response: generated.TagDefinitionCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    entryId: number;
    prefer?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void>;
  /**
   * Returns the children entries of a folder in the repository using a next link
   * - Related: {@link generated.IEntriesClient.listEntries listEntries}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of entry listings allowed per API response schema
   * @return A collection of children entries of a folder.
   */
  listEntriesNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.EntryCollectionResponse>;
  /**
   * Returns the fields assigned to an entry using a next link
   * - Related: {@link generated.IEntriesClient.listFields listFields}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of field values allowed per API response schema
   * @return A collection of fields assigned to the entry.
   */
  listFieldsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.FieldCollectionResponse>;
  /**
   * Get the links assigned to an entry using a next link
   * - Related: {@link generated.IEntriesClient.listLinks listLinks}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of link values from entry allowed per API response schema
   * @return A collection of links assigned to the entry.
   */
  listLinksNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.LinkCollectionResponse>;
  /**
   * Get the tags assigned to an entry using a next link
   * - Related: {@link generated.IEntriesClient.listTags listTags}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of tags assigned to entry allowed per API response schema
   * @return A collection of tags assigned to the entry.
   */
  listTagsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.TagDefinitionCollectionResponse>;
}
export class EntriesClient extends generated.EntriesClient implements IEntriesClient {
  /**
   * It will continue to make the same call to get a list of entry listings of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.IEntriesClient.listEntries listEntries}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.entryId The requested entry ID.
   * @param args.groupByEntryType (optional) An optional query parameter used to indicate if the result should be grouped by entry type or not.
   * @param args.fields (optional) Optional array of field names. Field values corresponding to the given field names will be returned for each entry.
   * @param args.formatFieldValues (optional) Boolean for if field values should be formatted. Only applicable if Fields are specified.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFieldValues query parameter must be set to true, otherwise
          culture will not be used for formatting. 
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of entry listings allowed per API response schema.
   */
  async listEntriesForEach(args: {
    callback: (response: generated.EntryCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    entryId: number;
    groupByEntryType?: boolean;
    fields?: string[];
    formatFieldValues?: boolean;
    prefer?: string;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let {
      callback,
      repositoryId,
      entryId,
      groupByEntryType,
      fields,
      formatFieldValues,
      prefer,
      culture,
      select,
      orderby,
      top,
      skip,
      count,
      maxPageSize,
    } = args;
    var response = await this.listEntries({
      repositoryId,
      entryId,
      groupByEntryType,
      fields,
      formatFieldValues,
      prefer: createMaxPageSizePreferHeaderPayload(maxPageSize),
      culture,
      select,
      orderby,
      top,
      skip,
      count,
    });
    let nextLink = response.odataNextLink;
    while ((await callback(response)) && nextLink) {
      response = await getNextLinkListing<generated.EntryCollectionResponse>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processListEntries,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * It will continue to make the same call to get a list of field values of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.IEntriesClient.listFields listFields}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.entryId The requested entry ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.formatFieldValues (optional) An optional query parameter used to indicate if the field values should be formatted.
          The default value is false. 
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFieldValues query parameter must be set to true, otherwise
          culture will not be used for formatting. 
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of field values allowed per API response schema.
   */
  async listFieldsForEach(args: {
    callback: (response: generated.FieldCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    entryId: number;
    prefer?: string;
    formatFieldValues?: boolean;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repositoryId, entryId, prefer, formatFieldValues, culture, select, orderby, top, skip, count, maxPageSize } =
      args;
    var response = await this.listFields({
      repositoryId,
      entryId,
      prefer: createMaxPageSizePreferHeaderPayload(maxPageSize),
      formatFieldValues,
      culture,
      select,
      orderby,
      top,
      skip,
      count,
    });
    let nextLink = response.odataNextLink;
    while ((await callback(response)) && nextLink) {
      response = await getNextLinkListing<generated.FieldCollectionResponse>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processListFields,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * It will continue to make the same call to get a list of link values from entry of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.IEntriesClient.listLinks listLinks}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.entryId The requested entry ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of link values from entry allowed per API response schema.
   */
  async listLinksForEach(args: {
    callback: (response: generated.LinkCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    entryId: number;
    prefer?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repositoryId, entryId, prefer, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.listLinks({
      repositoryId,
      entryId,
      prefer: createMaxPageSizePreferHeaderPayload(maxPageSize),
      select,
      orderby,
      top,
      skip,
      count,
    });
    let nextLink = response.odataNextLink;
    while ((await callback(response)) && nextLink) {
      response = await getNextLinkListing<generated.LinkCollectionResponse>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processListLinks,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * It will continue to make the same call to get a list of tags assigned to entry of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.IEntriesClient.listTags listTags}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.entryId The requested entry ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of tags assigned to entry allowed per API response schema.
   */
  async listTagsForEach(args: {
    callback: (response: generated.TagDefinitionCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    entryId: number;
    prefer?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repositoryId, entryId, prefer, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.listTags({
      repositoryId,
      entryId,
      prefer: createMaxPageSizePreferHeaderPayload(maxPageSize),
      select,
      orderby,
      top,
      skip,
      count,
    });
    let nextLink = response.odataNextLink;
    while ((await callback(response)) && nextLink) {
      response = await getNextLinkListing<generated.TagDefinitionCollectionResponse>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processListTags,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * Returns the children entries of a folder in the repository using a next link
   * - Related: {@link generated.IEntriesClient.listEntries listEntries}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of entry listings allowed per API response schema
   * @return A collection of children entries of a folder.
   */
  async listEntriesNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.EntryCollectionResponse> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.EntryCollectionResponse>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processListEntries,
      nextLink,
      maxPageSize
    );
  }
  /**
   * Returns the fields assigned to an entry using a next link
   * - Related: {@link generated.IEntriesClient.listFields listFields}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of field values allowed per API response schema
   * @return A collection of fields assigned to the entry.
   */
  async listFieldsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.FieldCollectionResponse> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.FieldCollectionResponse>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processListFields,
      nextLink,
      maxPageSize
    );
  }
  /**
   * Returns the links assigned to an entry using a next link
   * - Related: {@link generated.IEntriesClient.listLinks listLinks}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of link values from entry allowed per API response schema
   * @return A collection of links assigned to the entry.
   */
  async listLinksNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.LinkCollectionResponse> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.LinkCollectionResponse>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processListLinks,
      nextLink,
      maxPageSize
    );
  }
  /**
   * Returns the entry tags assigned to an entry using a link
   * - Related: {@link generated.IEntriesClient.listTags listTags}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of tags assigned to entry allowed per API response schema
   * @return A collection of tags assigned to the entry.
   */
  async listTagsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.TagDefinitionCollectionResponse> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.LinkCollectionResponse>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processListTags,
      nextLink,
      maxPageSize
    );
  }
}

export interface IFieldDefinitionsClient {
  /**
   * It will continue to make the same call to get a list of field definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.IFieldDefinitionsClient.listFieldDefinitions listFieldDefinitions}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFieldValues query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of field definitions allowed per API response schema.
   */
  listFieldDefinitionsForEach(args: {
    callback: (response: generated.FieldDefinitionCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    prefer?: string;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void>;
  /**
   * Returns a paged listing of field definitions available in the specified repository using a next link
   * - Related: {@link generated.IFieldDefinitionsClient.listFieldDefinitions listFieldDefinitions}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of field definitions allowed per API response schema
   * @return A collection of field definitions.
   */
  listFieldDefinitionsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.FieldDefinitionCollectionResponse>;
}

export class FieldDefinitionsClient extends generated.FieldDefinitionsClient implements IFieldDefinitionsClient {
  /**
   * It will continue to make the same call to get a list of field definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.IFieldDefinitionsClient.listFieldDefinitions listFieldDefinitions}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFieldValues query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of field definitions allowed per API response schema.
   */
  async listFieldDefinitionsForEach(args: {
    callback: (response: generated.FieldDefinitionCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    prefer?: string;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repositoryId, prefer, culture, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.listFieldDefinitions({
      repositoryId,
      prefer: createMaxPageSizePreferHeaderPayload(maxPageSize),
      culture,
      select,
      orderby,
      top,
      skip,
      count,
    });
    let nextLink = response.odataNextLink;
    while ((await callback(response)) && nextLink) {
      response = await getNextLinkListing<generated.FieldDefinitionCollectionResponse>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processListFieldDefinitions,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * Returns a paged listing of field definitions available in the specified repository using a next link
   * - Related: {@link generated.IFieldDefinitionsClient.listFieldDefinitions listFieldDefinitions}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of field definitions allowed per API response schema
   * @return A collection of field definitions.
   */
  async listFieldDefinitionsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.FieldDefinitionCollectionResponse> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.FieldDefinitionCollectionResponse>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processListFieldDefinitions,
      nextLink,
      maxPageSize
    );
  }
}

export interface ISearchesClient {
  /**
   * It will continue to make the same call to get a list of search results of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.ISearchesClient.listSearchResults listSearchResults}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.taskId The requested task ID.
   * @param args.groupByEntryType (optional) An optional query parameter used to indicate if the result should be grouped by entry type or not.
   * @param args.refresh (optional) If the search listing should be refreshed to show updated values.
   * @param args.fields (optional) Optional array of field names. Field values corresponding to the given field names will be returned for each entry.
   * @param args.formatFieldValues (optional) Boolean for if field values should be formatted. Only applicable if Fields are specified.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFieldValues query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of search results allowed per API response schema.
   */
  listSearchResultsForEach(args: {
    callback: (response: generated.EntryCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    taskId: string;
    groupByEntryType?: boolean;
    refresh?: boolean;
    fields?: string[];
    formatFieldValues?: boolean;
    prefer?: string;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void>;
  /**
   * It will continue to make the same call to get a list of search context hits of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.ISearchesClient.listSearchContextHits listSearchContextHits}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.taskId The requested task ID.
   * @param args.rowNumber The search result listing row number to get context hits for.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of search context hits allowed per API response schema.
   */
  listSearchContextHitsForEach(args: {
    callback: (response: generated.SearchContextHitCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    taskId: string;
    rowNumber: number;
    prefer?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void>;
  /**
   * Returns a search result listing if the search is completed using a next link
   * - Related: {@link generated.ISearchesClient.listSearchResults listSearchResults}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of search results allowed per API response schema
   * @return A collection of entry search results.
   */
  listSearchResultsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.EntryCollectionResponse>;
  /**
   * Returns the context hits associated with a search result entry using a next link
   * - Related: {@link generated.ISearchesClient.listSearchContextHits listSearchContextHits}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of search context hits allowed per API response schema
   * @return A collection of context hits for a search result.
   */
  listSearchContextHitsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.SearchContextHitCollectionResponse>;
}

export class SearchesClient extends generated.SearchesClient implements ISearchesClient {
  /**
   * It will continue to make the same call to get a list of search results of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.ISearchesClient.listSearchResults listSearchResults}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.taskId The requested task ID.
   * @param args.groupByEntryType (optional) An optional query parameter used to indicate if the result should be grouped by entry type or not.
   * @param args.refresh (optional) If the search listing should be refreshed to show updated values.
   * @param args.fields (optional) Optional array of field names. Field values corresponding to the given field names will be returned for each entry.
   * @param args.formatFieldValues (optional) Boolean for if field values should be formatted. Only applicable if Fields are specified.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFieldValues query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of search results allowed per API response schema.
   */
  async listSearchResultsForEach(args: {
    callback: (response: generated.EntryCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    taskId: string;
    groupByEntryType?: boolean;
    refresh?: boolean;
    fields?: string[];
    formatFieldValues?: boolean;
    prefer?: string;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let {
      callback,
      repositoryId,
      taskId,
      groupByEntryType,
      refresh,
      fields,
      formatFieldValues,
      prefer,
      culture,
      select,
      orderby,
      top,
      skip,
      count,
      maxPageSize,
    } = args;
    var response = await this.listSearchResults({
      repositoryId,
      taskId,
      groupByEntryType,
      refresh,
      fields,
      formatFieldValues,
      prefer: createMaxPageSizePreferHeaderPayload(maxPageSize),
      culture,
      select,
      orderby,
      top,
      skip,
      count,
    });
    let nextLink = response.odataNextLink;
    while ((await callback(response)) && nextLink) {
      response = await getNextLinkListing<generated.EntryCollectionResponse>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processListSearchResults,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * It will continue to make the same call to get a list of search context hits of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.ISearchesClient.listSearchContextHits listSearchContextHits}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.taskId The requested task ID.
   * @param args.rowNumber The search result listing row number to get context hits for.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of search context hits allowed per API response schema.
   */
  async listSearchContextHitsForEach(args: {
    callback: (response: generated.SearchContextHitCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    taskId: string;
    rowNumber: number;
    prefer?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repositoryId, taskId, rowNumber, prefer, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.listSearchContextHits({
      repositoryId,
      taskId,
      rowNumber,
      prefer: createMaxPageSizePreferHeaderPayload(maxPageSize),
      select,
      orderby,
      top,
      skip,
      count,
    });
    let nextLink = response.odataNextLink;
    while ((await callback(response)) && nextLink) {
      response = await getNextLinkListing<generated.SearchContextHitCollectionResponse>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processListSearchContextHits,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * Returns a search result listing if the search is completed using a next link
   * - Related: {@link generated.ISearchesClient.listSearchResults listSearchResults}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of search results allowed per API response schema
   * @return A collection of entry search results.
   */
  async listSearchResultsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.EntryCollectionResponse> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.EntryCollectionResponse>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processListSearchResults,
      nextLink,
      maxPageSize
    );
  }
  /**
   * Returns the context hits associated with a search result entry using a next link
   * - Related: {@link generated.ISearchesClient.listSearchContextHits listSearchContextHits}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of search context hits allowed per API response schema
   * @return A collection of context hits for a search result.
   */
  async listSearchContextHitsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.SearchContextHitCollectionResponse> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.SearchContextHitCollectionResponse>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processListSearchContextHits,
      nextLink,
      maxPageSize
    );
  }
}

export interface ITagDefinitionsClient {
  /**
   * It will continue to make the same call to get a list of tag definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.ITagDefinitionsClient.listTagDefinitions listTagDefinitions}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFieldValues query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of tag definitions allowed per API response schema.
   */
  listTagDefinitionsForEach(args: {
    callback: (response: generated.TagDefinitionCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    prefer?: string;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void>;
  /**
   * Returns all tag definitions in the repository using a next link
   * - Related: {@link generated.ITagDefinitionsClient.listTagDefinitions listTagDefinitions}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of tag definitions allowed per API response schema
   * @return A collection of tag definitions.
   */
  listTagDefinitionsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.TagDefinitionCollectionResponse>;
}

export class TagDefinitionsClient extends generated.TagDefinitionsClient implements ITagDefinitionsClient {
  /**
   * It will continue to make the same call to get a list of tag definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.ITagDefinitionsClient.listTagDefinitions listTagDefinitions}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFieldValues query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of tag definitions allowed per API response schema.
   */
  async listTagDefinitionsForEach(args: {
    callback: (response: generated.TagDefinitionCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    prefer?: string;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repositoryId, prefer, culture, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.listTagDefinitions({
      repositoryId,
      prefer: createMaxPageSizePreferHeaderPayload(maxPageSize),
      culture,
      select,
      orderby,
      top,
      skip,
      count,
    });
    let nextLink = response.odataNextLink;
    while ((await callback(response)) && nextLink) {
      response = await getNextLinkListing<generated.TagDefinitionCollectionResponse>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processListTagDefinitions,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * Returns all tag definitions in the repository using a next link
   * - Related: {@link generated.ITagDefinitionsClient.listTagDefinitions listTagDefinitions}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of tag definitions allowed per API response schema
   * @return A collection of tag definitions.
   */
  async listTagDefinitionsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.TagDefinitionCollectionResponse> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.TagDefinitionCollectionResponse>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processListTagDefinitions,
      nextLink,
      maxPageSize
    );
  }
}

export interface ITemplateDefinitionsClient {
  /**
   * It will continue to make the same call to get a list of template definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.ITemplateDefinitionsClient.listTemplateDefinitions listTemplateDefinitions}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.templateName (optional) An optional query parameter. Can be used to get a single template definition using the template name.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFieldValues query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of template definitions allowed per API response schema.
   */
  listTemplateDefinitionsForEach(args: {
    callback: (response: generated.TemplateDefinitionCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    templateName?: string;
    prefer?: string;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void>;
  /**
   * It will continue to make the same call to get a list of template field definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.ITemplateDefinitionsClient.listTemplateFieldDefinitionsByTemplateId listTemplateFieldDefinitionsByTemplateId}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.templateName (optional) An optional query parameter. Can be used to get a single template definition using the template name.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFieldValues query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of template field definitions allowed per API response schema.
   */
  listTemplateFieldDefinitionsByTemplateIdForEach(args: {
    callback: (response: generated.TemplateFieldDefinitionCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    templateId: number;
    prefer?: string;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void>;
  /**
   * It will continue to make the same call to get a list of template field definitions by template name of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.ITemplateDefinitionsClient.listTemplateFieldDefinitionsByTemplateName listTemplateFieldDefinitionsByTemplateName}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.templateName (optional) An optional query parameter. Can be used to get a single template definition using the template name.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFieldValues query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of template field definitions by template name allowed per API response schema.
   */
  listTemplateFieldDefinitionsByTemplateNameForEach(args: {
    callback: (response: generated.TemplateFieldDefinitionCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    templateName: string;
    prefer?: string;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void>;
  /**
   * Returns all template definitions (including field definitions) in the repository using a next link
   * - Related: {@link generated.ITemplateDefinitionsClient.listTemplateDefinitions listTemplateDefinitions}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of template definitions allowed per API response schema
   * @return A collection of template definitions.
   */
  listTemplateDefinitionsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.TemplateDefinitionCollectionResponse>;
  /**
   * Returns the field definitions assigned to a template definition using a next link
   * - Related: {@link generated.ITemplateDefinitionsClient.listTemplateFieldDefinitionsByTemplateId listTemplateFieldDefinitionsByTemplateId}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of template field definitions allowed per API response schema
   * @return A collection of template field definitions.
   */
  listTemplateFieldDefinitionsByTemplateIdNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.TemplateFieldDefinitionCollectionResponse>;
  /**
   * Returns the field definitions assigned to a template definition by template name using a next link
   * - Related: {@link generated.ITemplateDefinitionsClient.listTemplateFieldDefinitionsByTemplateName listTemplateFieldDefinitionsByTemplateName}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of template field definitions by template name allowed per API response schema
   * @return A collection of template field definitions.
   */
  listTemplateFieldDefinitionsByTemplateNameNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.TemplateFieldDefinitionCollectionResponse>;
}

export class TemplateDefinitionsClient
  extends generated.TemplateDefinitionsClient
  implements ITemplateDefinitionsClient
{
  /**
   * Given a maximum page size, it will continue to make the same call to get a list of template definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.ITemplateDefinitionsClient.listTemplateDefinitions listTemplateDefinitions}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.templateName (optional) An optional query parameter. Can be used to get a single template definition using the template name.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFieldValues query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of template definitions allowed per API response schema.
   */
  async listTemplateDefinitionsForEach(args: {
    callback: (response: generated.TemplateDefinitionCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    templateName?: string;
    prefer?: string;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repositoryId, templateName, prefer, culture, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.listTemplateDefinitions({
      repositoryId,
      templateName,
      prefer: createMaxPageSizePreferHeaderPayload(maxPageSize),
      culture,
      select,
      orderby,
      top,
      skip,
      count,
    });
    let nextLink = response.odataNextLink;
    while ((await callback(response)) && nextLink) {
      response = await getNextLinkListing<generated.TemplateDefinitionCollectionResponse>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processListTemplateDefinitions,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * It will continue to make the same call to get a list of template field definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.ITemplateDefinitionsClient.listTemplateFieldDefinitionsByTemplateId listTemplateFieldDefinitionsByTemplateId}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.templateName (optional) An optional query parameter. Can be used to get a single template definition using the template name.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFieldValues query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of template field definitions allowed per API response schema.
   */
  async listTemplateFieldDefinitionsByTemplateIdForEach(args: {
    callback: (response: generated.TemplateFieldDefinitionCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    templateId: number;
    prefer?: string;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repositoryId, templateId, prefer, culture, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.listTemplateFieldDefinitionsByTemplateId({
      repositoryId,
      templateId,
      prefer: createMaxPageSizePreferHeaderPayload(maxPageSize),
      culture,
      select,
      orderby,
      top,
      skip,
      count,
    });
    let nextLink = response.odataNextLink;
    while ((await callback(response)) && nextLink) {
      response = await getNextLinkListing<generated.TemplateFieldDefinitionCollectionResponse>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processListTemplateFieldDefinitionsByTemplateId,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * It will continue to make the same call to get a list of template field definitions by template name of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.ITemplateDefinitionsClient.listTemplateFieldDefinitionsByTemplateName listTemplateFieldDefinitionsByTemplateName}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.templateName (optional) An optional query parameter. Can be used to get a single template definition using the template name.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFieldValues query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of template field definitions by template name allowed per API response schema.
   */
  async listTemplateFieldDefinitionsByTemplateNameForEach(args: {
    callback: (response: generated.TemplateFieldDefinitionCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    templateName: string;
    prefer?: string;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repositoryId, templateName, prefer, culture, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.listTemplateFieldDefinitionsByTemplateName({
      repositoryId,
      templateName,
      prefer: createMaxPageSizePreferHeaderPayload(maxPageSize),
      culture,
      select,
      orderby,
      top,
      skip,
      count,
    });
    let nextLink = response.odataNextLink;
    while ((await callback(response)) && nextLink) {
      response = await getNextLinkListing<generated.TemplateFieldDefinitionCollectionResponse>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processListTemplateFieldDefinitionsByTemplateName,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * Returns all template definitions (including field definitions) in the repository using a next link
   * - Related: {@link generated.ITemplateDefinitionsClient.listTemplateDefinitions listTemplateDefinitions}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of template definitions allowed per API response schema
   * @return A collection of template definitions.
   */
  async listTemplateDefinitionsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.TemplateDefinitionCollectionResponse> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.TemplateDefinitionCollectionResponse>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processListTemplateDefinitions,
      nextLink,
      maxPageSize
    );
  }
  /**
   * Returns the field definitions assigned to a template definition using a next link
   * - Related: {@link generated.ITemplateDefinitionsClient.listTemplateFieldDefinitionsByTemplateId listTemplateFieldDefinitionsByTemplateId}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of template field definitions allowed per API response schema
   * @return A collection of template field definitions.
   */
  async listTemplateFieldDefinitionsByTemplateIdNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.TemplateFieldDefinitionCollectionResponse> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.TemplateFieldDefinitionCollectionResponse>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processListTemplateFieldDefinitionsByTemplateId,
      nextLink,
      maxPageSize
    );
  }
  /**
   * Returns the field definitions assigned to a template definition by template name using a next link
   * - Related: {@link generated.ITemplateDefinitionsClient.listTemplateFieldDefinitionsByTemplateName listTemplateFieldDefinitionsByTemplateName}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of template field definitions by template name allowed per API response schema
   * @return A collection of template field definitions.
   */
  async listTemplateFieldDefinitionsByTemplateNameNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.TemplateFieldDefinitionCollectionResponse> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.TemplateFieldDefinitionCollectionResponse>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processListTemplateFieldDefinitionsByTemplateName,
      nextLink,
      maxPageSize
    );
  }
}

export interface ILinkDefinitionsClient {
  /**
   * It will continue to make the same call to get a list of link definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.ILinkDefinitionsClient.listLinkDefinitions listLinkDefinitions}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of link definitions allowed per API response schema.
   */
  listLinkDefinitionsForEach(args: {
    callback: (response: generated.LinkDefinitionCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    prefer?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void>;

  /**
   * Returns all link definitions in the repository using a next link
   * - Related: {@link generated.ILinkDefinitionsClient.listLinkDefinitions listLinkDefinitions}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of link definitions allowed per API response schema
   * @return A collection of link definitions.
   */
  listLinkDefinitionsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.LinkDefinitionCollectionResponse>;
}

export class LinkDefinitionsClient extends generated.LinkDefinitionsClient implements ILinkDefinitionsClient {
  /**
   * It will continue to make the same call to get a list of link definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * - Related: {@link generated.ILinkDefinitionsClient.listLinkDefinitions listLinkDefinitions}
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repositoryId The requested repository ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of link definitions allowed per API response schema.
   */
  async listLinkDefinitionsForEach(args: {
    callback: (response: generated.LinkDefinitionCollectionResponse) => Promise<boolean>;
    repositoryId: string;
    prefer?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repositoryId, prefer, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.listLinkDefinitions({
      repositoryId,
      prefer: createMaxPageSizePreferHeaderPayload(maxPageSize),
      select,
      orderby,
      top,
      skip,
      count,
    });
    let nextLink = response.odataNextLink;
    while ((await callback(response)) && nextLink) {
      response = await getNextLinkListing<generated.LinkDefinitionCollectionResponse>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processListLinkDefinitions,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }

  /**
   * Returns all link definitions in the repository using a next link
   * - Related: {@link generated.ILinkDefinitionsClient.listLinkDefinitions listLinkDefinitions}
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of link definitions allowed per API response schema
   * @return A collection of link definitions.
   */
  async listLinkDefinitionsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.LinkDefinitionCollectionResponse> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.LinkDefinitionCollectionResponse>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processListLinkDefinitions,
      nextLink,
      maxPageSize
    );
  }
}

export class RepositoriesClient extends generated.RepositoriesClient {
  /**
   * Returns the repository resource list that current user has access to given the API server base URL. Only available in Laserfiche Self-Hosted.
   * - Related: {@link generated.IRepositoriesClient.listRepositories listRepositories}
   * @param args.baseUrl API server base URL e.g., https://{APIServerName}/LFRepositoryAPI
   * @returns A collection of respositories.
   */
  public static async listSelfHostedRepositories(args: { baseUrl: string }): Promise<generated.RepositoryCollectionResponse> {
    let { baseUrl } = args;
    const baseUrlWithoutSlash: string = StringUtils.trimEnd(baseUrl, '/');
    let http = {
      fetch,
    };
    return await new generated.RepositoriesClient(baseUrlWithoutSlash, http).listRepositories({});
  }
}

export class ProblemDetails extends generated.ProblemDetails {
  extensions: any;
}
export class ApiException extends ApiExceptionCore {
  constructor(message: string, status: number, response: string, headers: { [key: string]: any }, result: any) {
    super(message, status, headers, result);
  }
}
