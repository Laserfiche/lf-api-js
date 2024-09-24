// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import {
  AdvancedSearchRequest,
  ODataValueContextOfIListOfContextHit,
  ODataValueContextOfIListOfEntry
} from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

let searchToken: string;
describe('Search Integration Tests', () => {
  
  beforeEach(async () => {
    searchToken = '';
  });

  afterEach(async () => {
    if (searchToken) {
      await _RepositoryApiClient.searchesClient.cancelOrCloseSearch({ repoId: repositoryId, searchToken });
    }
  });

  test('Get Search Context Hits', async () => {
    let request = new AdvancedSearchRequest();
    request.searchCommand = '({LF:Basic ~= \"search text\", option="DFANLT"})';
    var searchResponse = await _RepositoryApiClient.searchesClient.createSearchOperation({ repoId: repositoryId, request });
    searchToken = searchResponse.token ?? '';
    expect(searchToken).not.toBeNull();
    expect(searchToken).not.toBe('');
    await new Promise((r) => setTimeout(r, 5000));
    var searchResultsResponse = await _RepositoryApiClient.searchesClient.getSearchResults({ repoId: repositoryId, searchToken });
    var searchResults = searchResultsResponse.value;
    if (!searchResults) {
      throw new Error('searchResults is undefined');
    }
    expect(searchResults).not.toBeNull();
    expect(searchResults.length > 0).toBeTruthy();
    let rowNum = searchResults[0].rowNumber;

    var contextHitResponse = await _RepositoryApiClient.searchesClient.getSearchContextHits({
      repoId: repositoryId,
      searchToken,
      rowNumber: rowNum ?? -1,
    });
    var contextHits = contextHitResponse.value;
    expect(contextHits).not.toBeNull();
  });

  test('Get Search Results for each Paging', async () => {
    let maxPageSize = 10;
    let searchRequest = new AdvancedSearchRequest();
    searchRequest.searchCommand = '({LF:Basic ~= \"search text\", option="DFANLT"})';
    let searchResponse = await _RepositoryApiClient.searchesClient.createSearchOperation({
      repoId: repositoryId,
      request: searchRequest,
    });
    searchToken = searchResponse.token ?? '';
    expect(searchToken).not.toBe('');
    expect(searchToken).not.toBeNull();
    await new Promise((r) => setTimeout(r, 10000));
    let searchResults = 0;
    let pages = 0;
    const callback = async (response: ODataValueContextOfIListOfEntry) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      searchResults += response.value.length;
      pages += 1;
      return true;
    };
    await _RepositoryApiClient.searchesClient.getSearchResultsForEach({ callback, repoId: repositoryId, searchToken, maxPageSize });
    expect(searchResults).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });

  test('Get Search Context Hits for each Paging', async () => {
    let maxPageSize = 10;
    let searchRequest = new AdvancedSearchRequest();
    searchRequest.searchCommand = '({LF:Basic ~= "search", option="DFANLT"})';
    let searchResponse = await _RepositoryApiClient.searchesClient.createSearchOperation({
      repoId: repositoryId,
      request: searchRequest,
    });
    searchToken = searchResponse.token ?? '';
    expect(searchToken).not.toBe('');
    expect(searchToken).not.toBeNull();
    await new Promise((r) => setTimeout(r, 5000));
    var searchResultsResponse = await _RepositoryApiClient.searchesClient.getSearchResults({ repoId: repositoryId, searchToken });
    if (!searchResultsResponse.value) {
      throw new Error('searchResultsResponse.value is undefined');
    }
    var searchResults = searchResultsResponse.value;
    expect(searchResults).not.toBeNull();
    expect(searchResults.length > 0).toBeTruthy();
    let rowNum = searchResults[0].rowNumber ?? 0;
    let searchContextHits = 0;
    let pages = 0;
    const callback = async (response: ODataValueContextOfIListOfContextHit) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      searchContextHits += response.value.length;
      pages += 1;
      return true;
    };
    await _RepositoryApiClient.searchesClient.getSearchContextHitsForEach({
      callback,
      repoId: repositoryId,
      searchToken,
      rowNumber: rowNum,
      maxPageSize,
    });
    expect(searchContextHits).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });

  test('Get Search Results', async () => {
    let request = new AdvancedSearchRequest();
    request.searchCommand = '({LF:Basic ~= \"search text\", option="DFANLT"})';
    var searchResponse = await _RepositoryApiClient.searchesClient.createSearchOperation({ repoId: repositoryId, request });
    searchToken = searchResponse.token ?? '';
    expect(searchToken).not.toBeNull();
    expect(searchToken).not.toBe('');
    await new Promise((r) => setTimeout(r, 10000));
    var searchResultsResponse = await _RepositoryApiClient.searchesClient.getSearchResults({ repoId: repositoryId, searchToken });
    var searchResults = searchResultsResponse.value;
    expect(searchResults).not.toBeNull();
  });

  test('Get Search Status', async () => {
    let request = new AdvancedSearchRequest();
    request.searchCommand = '({LF:Basic ~= \"search text\", option="DFANLT"})';
    var searchResponse = await _RepositoryApiClient.searchesClient.createSearchOperation({ repoId: repositoryId, request });
    searchToken = searchResponse.token ?? '';
    expect(searchToken).not.toBeNull();
    expect(searchToken).not.toBe('');
    await new Promise((r) => setTimeout(r, 5000));
    var searchStatusResponse = await _RepositoryApiClient.searchesClient.getSearchStatus({ repoId: repositoryId, searchToken });
    var searchStatus = searchStatusResponse;
    expect(searchStatus).not.toBeNull();
    expect(searchStatus.operationToken).toBe(searchToken);
  });
});
