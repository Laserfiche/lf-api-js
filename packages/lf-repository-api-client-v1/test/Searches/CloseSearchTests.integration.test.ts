// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import {
  AdvancedSearchRequest,
  ODataValueContextOfIListOfEntry,
} from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

let searchToken: string | undefined;

describe('Search Integration Tests', () => {
  beforeEach(async () => {
    searchToken = '';
  });

  afterEach(async () => {
    if (searchToken) {
      await _RepositoryApiClient.searchesClient.cancelOrCloseSearch({
        repoId: repositoryId,
        searchToken,
      });
    }
  });
  test('Close Search Operations', async () => {
    //create search
    const request = new AdvancedSearchRequest();
    request.searchCommand = '({LF:Basic ~= "search text", option="DFANLT"})';
    const response =
      await _RepositoryApiClient.searchesClient.createSearchOperation({
        repoId: repositoryId,
        request,
      });
    const searchToken = response.token;
    expect(searchToken).not.toBeNull();

    //close the search
    const closeSearchResponse =
      await _RepositoryApiClient.searchesClient.cancelOrCloseSearch({
        repoId: repositoryId,
        searchToken: searchToken ?? '',
      });
    expect(closeSearchResponse.value).toBe(true);
  });

  test('Get Search Results simple Paging', async () => {
    const maxPageSize = 1;
    const searchRequest = new AdvancedSearchRequest();
    searchRequest.searchCommand =
      '({LF:Basic ~= "search text", option="DFANLT"})';
    const searchResponse =
      await _RepositoryApiClient.searchesClient.createSearchOperation({
        repoId: repositoryId,
        request: searchRequest,
      });
   searchToken = searchResponse.token ?? '';
    expect(searchToken).not.toBe('');
    expect(searchToken).not.toBeNull();
    await new Promise((r) => setTimeout(r, 5000));
    const prefer = `maxpagesize=${maxPageSize}`;
    const response: ODataValueContextOfIListOfEntry =
      await _RepositoryApiClient.searchesClient.getSearchResults({
        repoId: repositoryId,
        searchToken,
        prefer,
      });
    if (!response.value) {
      throw new Error('response.value is undefined');
    }
    expect(response).not.toBeNull();
    const nextLink: string = response.odataNextLink ?? '';
    expect(nextLink).not.toBeNull();
    expect(response.value.length).toBeLessThanOrEqual(maxPageSize);
    const response2 =
      await _RepositoryApiClient.searchesClient.getSearchResultsNextLink({
        nextLink,
        maxPageSize,
      });
    if (!response2.value) {
      throw new Error('response2.value is undefined');
    }
    expect(response2).not.toBeNull();
    expect(response2.value.length).toBeLessThanOrEqual(maxPageSize);
  });
});
