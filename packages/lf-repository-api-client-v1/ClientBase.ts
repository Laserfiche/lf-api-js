// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import * as generated from './index.js';
import { UrlUtils, StringUtils } from '@laserfiche/lf-js-utils';
import {
  UsernamePasswordHandler,
  OAuthClientCredentialsHandler,
  HttpRequestHandler,
  DomainUtils,
  AccessKey,
  ApiException as ApiExceptionCore,
  GetAccessTokenResponse,
  OAuthClientCustomTokenCredentialsHandler,
} from '@laserfiche/lf-api-client-core';
class ClientBase {}
export interface IRepositoryApiClient {
  attributesClient: IAttributesClient;
  auditReasonsClient: generated.IAuditReasonsClient;
  entriesClient: IEntriesClient;
  fieldDefinitionsClient: IFieldDefinitionsClient;
  repositoriesClient: generated.IRepositoriesClient;
  searchesClient: ISearchesClient;
  serverSessionClient: generated.IServerSessionClient;
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
  public serverSessionClient: generated.IServerSessionClient;
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
    this.serverSessionClient = new generated.ServerSessionClient(this.baseUrl, http);
    this.simpleSearchesClient = new generated.SimpleSearchesClient(this.baseUrl, http);
    this.tagDefinitionsClient = new TagDefinitionsClient(this.baseUrl, http);
    this.tasksClient = new generated.TasksClient(this.baseUrl, http);
    this.templateDefinitionsClient = new TemplateDefinitionsClient(this.baseUrl, http);
    this.linkDefinitionsClient = new LinkDefinitionsClient(this.baseUrl, http);
  }

  /**
   * Create a Laserfiche repository client.
   * @param httpRequestHandler - The http request handler for the Laserfiche repository client.
   * @param baseUrlDebug - (optional) override for the Laserfiche repository API base url.
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
   * @param getAccessTokenFunc - A function that will be used to retrieve the current Laserfiche API access token.
   * @param baseUrlDebug - (optional) override for the Laserfiche repository API base url.
   */
  public static createFromGetAccessTokenFunc(
    getAccessTokenFunc: () => Promise<GetAccessTokenResponse>,
    baseUrlDebug?: string
  ): RepositoryApiClient {
    const handler = new OAuthClientCustomTokenCredentialsHandler(getAccessTokenFunc);
    return new RepositoryApiClient(handler, baseUrlDebug);
  }

  /**
   * Create a Laserfiche repository client that will use Laserfiche Cloud OAuth client credentials to get access tokens.
   * @param servicePrincipalKey - The service principal key created for the service principal from the Laserfiche Account Administration.
   * @param accessKey - The access key exported from the Laserfiche Developer Console.
   * @param scope - (optional) The requested space-delimited scopes for the access token.
   * @param baseUrlDebug - (optional) override for the Laserfiche repository API base url.
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
   * @param repositoryId - The repository ID
   * @param username - The username
   * @param password - The password
   * @param baseUrl - API server base URL e.g., https://{APIServerName}/LFRepositoryAPI
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
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.everyone (optional) Boolean value that indicates whether to return attributes key value pairs associated with everyone or the currently authenticated user.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of attributes key value pairs allowed per API response schema
   */
  getTrusteeAttributeKeyValuePairsForEach(args: {
    callback: (response: generated.ODataValueContextOfListOfAttribute) => Promise<boolean>;
    repoId: string;
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
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of attribute keys allowed per API response schema
   * @returns Get trustee attribute keys with the next link successfully
   */
  getTrusteeAttributeKeyValuePairsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfListOfAttribute>;
}

export class AttributesClient extends generated.AttributesClient implements IAttributesClient {
  /**
   * It will continue to make the same call to get a list of attributes key value pairs of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.everyone (optional) Boolean value that indicates whether to return attributes key value pairs associated with everyone or the currently authenticated user.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of attributes key value pairs allowed per API response schema
   */
  async getTrusteeAttributeKeyValuePairsForEach(args: {
    callback: (response: generated.ODataValueContextOfListOfAttribute) => Promise<boolean>;
    repoId: string;
    everyone?: boolean;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repoId, everyone, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.getTrusteeAttributeKeyValuePairs({
      repoId,
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
      response = await getNextLinkListing<generated.ODataValueContextOfListOfAttribute>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processGetTrusteeAttributeKeyValuePairs,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * Returns the attribute key value pairs using a next link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection.
   * @param args.maxPageSize (optional) the maximum page size or number of attribute keys allowed per API response schema.
   * @returns Get trustee attribute keys with the next link successfully
   */
  async getTrusteeAttributeKeyValuePairsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfListOfAttribute> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.ODataValueContextOfListOfAttribute>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processGetTrusteeAttributeKeyValuePairs,
      nextLink,
      maxPageSize
    );
  }
}

export interface IEntriesClient {
  /**
   * It will continue to make the same call to get a list of entry listings of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.entryId The requested entry ID.
   * @param args.groupByEntryType (optional) An optional query parameter used to indicate if the result should be grouped by entry type or not.
   * @param args.fields (optional) Optional array of field names. Field values corresponding to the given field names will be returned for each entry.
   * @param args.formatFields (optional) Boolean for if field values should be formatted. Only applicable if Fields are specified.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFields query parameter must be set to true, otherwise
          culture will not be used for formatting. 
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of entry listings allowed per API response schema.
   */
  getEntryListingForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfEntry) => Promise<boolean>;
    repoId: string;
    entryId: number;
    groupByEntryType?: boolean;
    fields?: string[];
    formatFields?: boolean;
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
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.entryId The requested entry ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.formatValue (optional) An optional query parameter used to indicate if the field values should be formatted.
          The default value is false. 
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFields query parameter must be set to true, otherwise
          culture will not be used for formatting. 
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of field values allowed per API response schema.
   */
  getFieldValuesForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfFieldValue) => Promise<boolean>;
    repoId: string;
    entryId: number;
    prefer?: string;
    formatValue?: boolean;
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
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.entryId The requested entry ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of link values from entry allowed per API response schema.
   */
  getLinkValuesFromEntryForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfWEntryLinkInfo) => Promise<boolean>;
    repoId: string;
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
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.entryId The requested entry ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of tags assigned to entry allowed per API response schema.
   */
  getTagsAssignedToEntryForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfWTagInfo) => Promise<boolean>;
    repoId: string;
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
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of entry listings allowed per API response schema
   * @returns Get the children entries of a Folder with the next link successfully
   */
  getEntryListingNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfEntry>;
  /**
   * Returns the fields assigned to an entry using a next link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of field values allowed per API response schema
   * @returns Get field values with the next link successfully
   */
  getFieldValuesNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfFieldValue>;
  /**
   * Get the links assigned to an entry using a next link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of link values from entry allowed per API response schema
   * @returns Get links with the next link successfully
   */
  getLinkValuesFromEntryNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfWEntryLinkInfo>;
  /**
   * Get the tags assigned to an entry using a next link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of tags assigned to entry allowed per API response schema
   * @returns Get entry tags with the next link successfully
   */
  getTagsAssignedToEntryNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfWTagInfo>;
}
export class EntriesClient extends generated.EntriesClient implements IEntriesClient {
  /**
   * It will continue to make the same call to get a list of entry listings of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.entryId The requested entry ID.
   * @param args.groupByEntryType (optional) An optional query parameter used to indicate if the result should be grouped by entry type or not.
   * @param args.fields (optional) Optional array of field names. Field values corresponding to the given field names will be returned for each entry.
   * @param args.formatFields (optional) Boolean for if field values should be formatted. Only applicable if Fields are specified.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFields query parameter must be set to true, otherwise
          culture will not be used for formatting. 
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of entry listings allowed per API response schema.
   */
  async getEntryListingForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfEntry) => Promise<boolean>;
    repoId: string;
    entryId: number;
    groupByEntryType?: boolean;
    fields?: string[];
    formatFields?: boolean;
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
      repoId,
      entryId,
      groupByEntryType,
      fields,
      formatFields,
      prefer,
      culture,
      select,
      orderby,
      top,
      skip,
      count,
      maxPageSize,
    } = args;
    var response = await this.getEntryListing({
      repoId,
      entryId,
      groupByEntryType,
      fields,
      formatFields,
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
      response = await getNextLinkListing<generated.ODataValueContextOfIListOfEntry>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processGetEntryListing,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * It will continue to make the same call to get a list of field values of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.entryId The requested entry ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.formatValue (optional) An optional query parameter used to indicate if the field values should be formatted.
          The default value is false. 
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFields query parameter must be set to true, otherwise
          culture will not be used for formatting. 
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of field values allowed per API response schema.
   */
  async getFieldValuesForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfFieldValue) => Promise<boolean>;
    repoId: string;
    entryId: number;
    prefer?: string;
    formatValue?: boolean;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repoId, entryId, prefer, formatValue, culture, select, orderby, top, skip, count, maxPageSize } =
      args;
    var response = await this.getFieldValues({
      repoId,
      entryId,
      prefer: createMaxPageSizePreferHeaderPayload(maxPageSize),
      formatValue,
      culture,
      select,
      orderby,
      top,
      skip,
      count,
    });
    let nextLink = response.odataNextLink;
    while ((await callback(response)) && nextLink) {
      response = await getNextLinkListing<generated.ODataValueContextOfIListOfFieldValue>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processGetFieldValues,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * It will continue to make the same call to get a list of link values from entry of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.entryId The requested entry ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of link values from entry allowed per API response schema.
   */
  async getLinkValuesFromEntryForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfWEntryLinkInfo) => Promise<boolean>;
    repoId: string;
    entryId: number;
    prefer?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repoId, entryId, prefer, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.getLinkValuesFromEntry({
      repoId,
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
      response = await getNextLinkListing<generated.ODataValueContextOfIListOfWEntryLinkInfo>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processGetLinkValuesFromEntry,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * It will continue to make the same call to get a list of tags assigned to entry of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.entryId The requested entry ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of tags assigned to entry allowed per API response schema.
   */
  async getTagsAssignedToEntryForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfWTagInfo) => Promise<boolean>;
    repoId: string;
    entryId: number;
    prefer?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repoId, entryId, prefer, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.getTagsAssignedToEntry({
      repoId,
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
      response = await getNextLinkListing<generated.ODataValueContextOfIListOfWTagInfo>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processGetTagsAssignedToEntry,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * Returns the children entries of a folder in the repository using a next link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of entry listings allowed per API response schema
   * @returns Get the children entries of a Folder with the next link successfully
   */
  async getEntryListingNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfEntry> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.ODataValueContextOfIListOfEntry>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processGetEntryListing,
      nextLink,
      maxPageSize
    );
  }
  /**
   * Returns the fields assigned to an entry using a next link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of field values allowed per API response schema
   * @returns Get field values with the next link successfully
   */
  async getFieldValuesNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfFieldValue> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.ODataValueContextOfIListOfFieldValue>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processGetFieldValues,
      nextLink,
      maxPageSize
    );
  }
  /**
   * Returns the links assigned to an entry using a next link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of link values from entry allowed per API response schema
   * @returns Get links with the next link successfully
   */
  async getLinkValuesFromEntryNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfWEntryLinkInfo> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.ODataValueContextOfIListOfWEntryLinkInfo>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processGetLinkValuesFromEntry,
      nextLink,
      maxPageSize
    );
  }
  /**
   * Returns the entry tags assigned to an entry using a link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of tags assigned to entry allowed per API response schema
   * @returns Get entry tags with the next link successfully
   */
  async getTagsAssignedToEntryNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfWTagInfo> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.ODataValueContextOfIListOfWEntryLinkInfo>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processGetTagsAssignedToEntry,
      nextLink,
      maxPageSize
    );
  }
}

export interface IFieldDefinitionsClient {
  /**
   * It will continue to make the same call to get a list of field definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFields query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of field definitions allowed per API response schema.
   */
  getFieldDefinitionsForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfWFieldInfo) => Promise<boolean>;
    repoId: string;
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
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of field definitions allowed per API response schema
   * @returns Get field definitions with the next link successfully
   */
  getFieldDefinitionsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfWFieldInfo>;
}

export class FieldDefinitionsClient extends generated.FieldDefinitionsClient implements IFieldDefinitionsClient {
  /**
   * It will continue to make the same call to get a list of field definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFields query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of field definitions allowed per API response schema.
   */
  async getFieldDefinitionsForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfWFieldInfo) => Promise<boolean>;
    repoId: string;
    prefer?: string;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repoId, prefer, culture, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.getFieldDefinitions({
      repoId,
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
      response = await getNextLinkListing<generated.ODataValueContextOfIListOfWFieldInfo>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processGetFieldDefinitions,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * Returns a paged listing of field definitions available in the specified repository using a next link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of field definitions allowed per API response schema
   * @returns Get field definitions with the next link successfully
   */
  async getFieldDefinitionsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfWFieldInfo> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.ODataValueContextOfIListOfWFieldInfo>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processGetFieldDefinitions,
      nextLink,
      maxPageSize
    );
  }
}

export interface ISearchesClient {
  /**
   * It will continue to make the same call to get a list of search results of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.searchToken The requested searchToken.
   * @param args.groupByEntryType (optional) An optional query parameter used to indicate if the result should be grouped by entry type or not.
   * @param args.refresh (optional) If the search listing should be refreshed to show updated values.
   * @param args.fields (optional) Optional array of field names. Field values corresponding to the given field names will be returned for each entry.
   * @param args.formatFields (optional) Boolean for if field values should be formatted. Only applicable if Fields are specified.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFields query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of search results allowed per API response schema.
   */
  getSearchResultsForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfEntry) => Promise<boolean>;
    repoId: string;
    searchToken: string;
    groupByEntryType?: boolean;
    refresh?: boolean;
    fields?: string[];
    formatFields?: boolean;
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
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.searchToken The requested searchToken.
   * @param args.rowNumber The search result listing row number to get context hits for.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of search context hits allowed per API response schema.
   */
  getSearchContextHitsForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfContextHit) => Promise<boolean>;
    repoId: string;
    searchToken: string;
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
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of search results allowed per API response schema
   * @returns Get search result with the next link successfully
   */
  getSearchResultsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfEntry>;
  /**
   * Returns the context hits associated with a search result entry using a next link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of search context hits allowed per API response schema
   * @returns Get search context hits with the next link successfully
   */
  getSearchContextHitsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfContextHit>;
}

export class SearchesClient extends generated.SearchesClient implements ISearchesClient {
  /**
   * It will continue to make the same call to get a list of search results of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.searchToken The requested searchToken.
   * @param args.groupByEntryType (optional) An optional query parameter used to indicate if the result should be grouped by entry type or not.
   * @param args.refresh (optional) If the search listing should be refreshed to show updated values.
   * @param args.fields (optional) Optional array of field names. Field values corresponding to the given field names will be returned for each entry.
   * @param args.formatFields (optional) Boolean for if field values should be formatted. Only applicable if Fields are specified.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFields query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of search results allowed per API response schema.
   */
  async getSearchResultsForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfEntry) => Promise<boolean>;
    repoId: string;
    searchToken: string;
    groupByEntryType?: boolean;
    refresh?: boolean;
    fields?: string[];
    formatFields?: boolean;
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
      repoId,
      searchToken,
      groupByEntryType,
      refresh,
      fields,
      formatFields,
      prefer,
      culture,
      select,
      orderby,
      top,
      skip,
      count,
      maxPageSize,
    } = args;
    var response = await this.getSearchResults({
      repoId,
      searchToken,
      groupByEntryType,
      refresh,
      fields,
      formatFields,
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
      response = await getNextLinkListing<generated.ODataValueContextOfIListOfEntry>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processGetSearchResults,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * It will continue to make the same call to get a list of search context hits of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.searchToken The requested searchToken.
   * @param args.rowNumber The search result listing row number to get context hits for.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of search context hits allowed per API response schema.
   */
  async getSearchContextHitsForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfContextHit) => Promise<boolean>;
    repoId: string;
    searchToken: string;
    rowNumber: number;
    prefer?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repoId, searchToken, rowNumber, prefer, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.getSearchContextHits({
      repoId,
      searchToken,
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
      response = await getNextLinkListing<generated.ODataValueContextOfIListOfContextHit>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processGetSearchContextHits,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * Returns a search result listing if the search is completed using a next link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of search results allowed per API response schema
   * @returns Get search result with the next link successfully
   */
  async getSearchResultsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfEntry> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.ODataValueContextOfIListOfEntry>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processGetSearchResults,
      nextLink,
      maxPageSize
    );
  }
  /**
   * Returns the context hits associated with a search result entry using a next link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of search context hits allowed per API response schema
   * @returns Get search context hits with the next link successfully
   */
  async getSearchContextHitsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfContextHit> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.ODataValueContextOfIListOfContextHit>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processGetSearchContextHits,
      nextLink,
      maxPageSize
    );
  }
}

export interface ITagDefinitionsClient {
  /**
   * It will continue to make the same call to get a list of tag definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFields query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of tag definitions allowed per API response schema.
   */
  getTagDefinitionsForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfWTagInfo) => Promise<boolean>;
    repoId: string;
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
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of tag definitions allowed per API response schema
   * @returns Get tag definitions with the next link successfully
   */
  getTagDefinitionsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfWTagInfo>;
}

export class TagDefinitionsClient extends generated.TagDefinitionsClient implements ITagDefinitionsClient {
  /**
   * It will continue to make the same call to get a list of tag definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFields query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of tag definitions allowed per API response schema.
   */
  async getTagDefinitionsForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfWTagInfo) => Promise<boolean>;
    repoId: string;
    prefer?: string;
    culture?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repoId, prefer, culture, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.getTagDefinitions({
      repoId,
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
      response = await getNextLinkListing<generated.ODataValueContextOfIListOfWTagInfo>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processGetTagDefinitions,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * Returns all tag definitions in the repository using a next link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of tag definitions allowed per API response schema
   * @returns Get tag definitions with the next link successfully
   */
  async getTagDefinitionsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfWTagInfo> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.ODataValueContextOfIListOfWTagInfo>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processGetTagDefinitions,
      nextLink,
      maxPageSize
    );
  }
}

export interface ITemplateDefinitionsClient {
  /**
   * It will continue to make the same call to get a list of template definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.templateName (optional) An optional query parameter. Can be used to get a single template definition using the template name.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFields query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of template definitions allowed per API response schema.
   */
  getTemplateDefinitionsForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfWTemplateInfo) => Promise<boolean>;
    repoId: string;
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
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.templateName (optional) An optional query parameter. Can be used to get a single template definition using the template name.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFields query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of template field definitions allowed per API response schema.
   */
  getTemplateFieldDefinitionsForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfTemplateFieldInfo) => Promise<boolean>;
    repoId: string;
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
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.templateName (optional) An optional query parameter. Can be used to get a single template definition using the template name.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFields query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of template field definitions by template name allowed per API response schema.
   */
  getTemplateFieldDefinitionsByTemplateNameForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfTemplateFieldInfo) => Promise<boolean>;
    repoId: string;
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
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of template definitions allowed per API response schema
   * @returns Get template definitions with the next link successfully
   */
  getTemplateDefinitionsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfWTemplateInfo>;
  /**
   * Returns the field definitions assigned to a template definition using a next link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of template field definitions allowed per API response schema
   * @returns Get field definitions with the next link successfully
   */
  getTemplateFieldDefinitionsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfTemplateFieldInfo>;
  /**
   * Returns the field definitions assigned to a template definition by template name using a next link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of template field definitions by template name allowed per API response schema
   * @returns Get field definitions by template name with the next link successfully
   */
  getTemplateFieldDefinitionsByTemplateNameNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfTemplateFieldInfo>;
}

export class TemplateDefinitionsClient
  extends generated.TemplateDefinitionsClient
  implements ITemplateDefinitionsClient
{
  /**
   * Given a maximum page size, it will continue to make the same call to get a list of template definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.templateName (optional) An optional query parameter. Can be used to get a single template definition using the template name.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFields query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of template definitions allowed per API response schema.
   */
  async getTemplateDefinitionsForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfWTemplateInfo) => Promise<boolean>;
    repoId: string;
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
    let { callback, repoId, templateName, prefer, culture, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.getTemplateDefinitions({
      repoId,
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
      response = await getNextLinkListing<generated.ODataValueContextOfIListOfWTemplateInfo>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processGetTemplateDefinitions,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * It will continue to make the same call to get a list of template field definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.templateName (optional) An optional query parameter. Can be used to get a single template definition using the template name.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFields query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of template field definitions allowed per API response schema.
   */
  async getTemplateFieldDefinitionsForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfTemplateFieldInfo) => Promise<boolean>;
    repoId: string;
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
    let { callback, repoId, templateId, prefer, culture, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.getTemplateFieldDefinitions({
      repoId,
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
      response = await getNextLinkListing<generated.ODataValueContextOfIListOfTemplateFieldInfo>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processGetTemplateFieldDefinitions,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * It will continue to make the same call to get a list of template field definitions by template name of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.templateName (optional) An optional query parameter. Can be used to get a single template definition using the template name.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.culture (optional) An optional query parameter used to indicate the locale that should be used for formatting.
          The value should be a standard language tag. The formatFields query parameter must be set to true, otherwise
          culture will not be used for formatting.  
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of template field definitions by template name allowed per API response schema.
   */
  async getTemplateFieldDefinitionsByTemplateNameForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfTemplateFieldInfo) => Promise<boolean>;
    repoId: string;
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
    let { callback, repoId, templateName, prefer, culture, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.getTemplateFieldDefinitionsByTemplateName({
      repoId,
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
      response = await getNextLinkListing<generated.ODataValueContextOfIListOfTemplateFieldInfo>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processGetTemplateFieldDefinitionsByTemplateName,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }
  /**
   * Returns all template definitions (including field definitions) in the repository using a next link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of template definitions allowed per API response schema
   * @returns Get template definitions with the next link successfully
   */
  async getTemplateDefinitionsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfWTemplateInfo> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.ODataValueContextOfIListOfWTemplateInfo>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processGetTemplateDefinitions,
      nextLink,
      maxPageSize
    );
  }
  /**
   * Returns the field definitions assigned to a template definition using a next link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of template field definitions allowed per API response schema
   * @returns Get field definitions with the next link successfully
   */
  async getTemplateFieldDefinitionsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfTemplateFieldInfo> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.ODataValueContextOfIListOfTemplateFieldInfo>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processGetTemplateFieldDefinitions,
      nextLink,
      maxPageSize
    );
  }
  /**
   * Returns the field definitions assigned to a template definition by template name using a next link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of template field definitions by template name allowed per API response schema
   * @returns Get field definitions by template name with the next link successfully
   */
  async getTemplateFieldDefinitionsByTemplateNameNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfTemplateFieldInfo> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.ODataValueContextOfIListOfTemplateFieldInfo>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processGetTemplateFieldDefinitionsByTemplateName,
      nextLink,
      maxPageSize
    );
  }
}

export interface ILinkDefinitionsClient {
  /**
   * It will continue to make the same call to get a list of link definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of link definitions allowed per API response schema.
   */
  getLinkDefinitionsForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfEntryLinkTypeInfo) => Promise<boolean>;
    repoId: string;
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
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of link definitions allowed per API response schema
   * @returns Get link definitions with the next link successfully
   */
  getLinkDefinitionsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfEntryLinkTypeInfo>;
}

export class LinkDefinitionsClient extends generated.LinkDefinitionsClient implements ILinkDefinitionsClient {
  /**
   * It will continue to make the same call to get a list of link definitions of a fixed size (i.e. maxpagesize) until it reaches the last page (i.e. when next link is null/undefined) or whenever the callback function returns false.
   * @param args.callback async callback function that will accept the current page results and return a boolean value to either continue or stop paging.
   * @param args.repoId The requested repository ID.
   * @param args.prefer (optional) An optional OData header. Can be used to set the maximum page size using odata.maxpagesize.
   * @param args.select (optional) Limits the properties returned in the result.
   * @param args.orderby (optional) Specifies the order in which items are returned. The maximum number of expressions is 5.
   * @param args.top (optional) Limits the number of items returned from a collection.
   * @param args.skip (optional) Excludes the specified number of items of the queried collection from the result.
   * @param args.count (optional) Indicates whether the total count of items within a collection are returned in the result.
   * @param args.maxPageSize (optional) the maximum page size or number of link definitions allowed per API response schema.
   */
  async getLinkDefinitionsForEach(args: {
    callback: (response: generated.ODataValueContextOfIListOfEntryLinkTypeInfo) => Promise<boolean>;
    repoId: string;
    prefer?: string;
    select?: string;
    orderby?: string;
    top?: number;
    skip?: number;
    count?: boolean;
    maxPageSize?: number;
  }): Promise<void> {
    let { callback, repoId, prefer, select, orderby, top, skip, count, maxPageSize } = args;
    var response = await this.getLinkDefinitions({
      repoId,
      prefer: createMaxPageSizePreferHeaderPayload(maxPageSize),
      select,
      orderby,
      top,
      skip,
      count,
    });
    let nextLink = response.odataNextLink;
    while ((await callback(response)) && nextLink) {
      response = await getNextLinkListing<generated.ODataValueContextOfIListOfEntryLinkTypeInfo>(
        // @ts-ignore: allow sub class to use private variable from the super class
        this.http,
        this.processGetLinkDefinitions,
        nextLink,
        maxPageSize
      );
      nextLink = response.odataNextLink;
    }
  }

  /**
   * Returns all link definitions in the repository using a next link
   * @param args.nextLink a url that allows retrieving the next subset of the requested collection
   * @param args.maxPageSize (optional) the maximum page size or number of link definitions allowed per API response schema
   * @returns Get link definitions with the next link successfully
   */
  async getLinkDefinitionsNextLink(args: {
    nextLink: string;
    maxPageSize?: number;
  }): Promise<generated.ODataValueContextOfIListOfEntryLinkTypeInfo> {
    let { nextLink, maxPageSize } = args;
    return await getNextLinkListing<generated.ODataValueContextOfIListOfEntryLinkTypeInfo>(
      // @ts-ignore: allow sub class to use private variable from the super class
      this.http,
      this.processGetLinkDefinitions,
      nextLink,
      maxPageSize
    );
  }
}

export class RepositoriesClient extends generated.RepositoriesClient {
  /**
   * Returns the repository resource list that current user has access to given the API server base URL. Only available in Laserfiche Self-Hosted.
   * @param args.baseUrl API server base URL e.g., https://{APIServerName}/LFRepositoryAPI
   * @returns Get the repository resource list successfully.
   */
  public static async getSelfHostedRepositoryList(args: { baseUrl: string }): Promise<generated.RepositoryInfo[]> {
    let { baseUrl } = args;
    const baseUrlWithoutSlash: string = StringUtils.trimEnd(baseUrl, '/');
    let http = {
      fetch,
    };
    return await new generated.RepositoriesClient(baseUrlWithoutSlash, http).getRepositoryList({});
  }
}

export class CreateEntryResult extends generated.CreateEntryResult {
  /** @internal */
  getSummary(): string {
    let messages = [];
    const entryId: number = this.operations?.entryCreate?.entryId ?? 0;
    if (entryId !== 0) {
      messages.push(`entryId = ${entryId}`);
    }

    function getErrorMessages(errors: generated.APIServerException[] | undefined): string {
      if (errors == null) {
        return '';
      }

      return errors.map((item) => item.message).join(' ');
    }

    messages.push(getErrorMessages(this.operations?.entryCreate?.exceptions));
    messages.push(getErrorMessages(this.operations?.setEdoc?.exceptions));
    messages.push(getErrorMessages(this.operations?.setFields?.exceptions));
    messages.push(getErrorMessages(this.operations?.setLinks?.exceptions));
    messages.push(getErrorMessages(this.operations?.setTags?.exceptions));
    messages.push(getErrorMessages(this.operations?.setTemplate?.exceptions));

    return messages.filter((item) => item).join(' ');
  }
}

export class ProblemDetails extends generated.ProblemDetails {
  extensions: any;
}
export class ApiException extends ApiExceptionCore {
  constructor(message: string, status: number, response: string, headers: { [key: string]: any }, result: any) {
    super(message, status, headers, result);

    if (result instanceof generated.CreateEntryResult) {
      this.problemDetails.title = result.getSummary();
      this.problemDetails.extensions = {
        createEntryResult: Object.assign({}, result),
      };
      this.message = this.problemDetails.title;
    }
  }
}
