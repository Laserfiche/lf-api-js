// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Get Entry Next Links Tests', () => {
  let entryId: number = 1;

  test('Get Entry Field simple paging', async () => {
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    let response = await _RepositoryApiClient.entriesClient.getFieldValues({ repoId: repositoryId, entryId, prefer });
    expect(response).not.toBeNull();
    let nextLink = response.toJSON()['@odata.nextLink'];
    expect(nextLink).not.toBeNull();
    expect(response.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
    let response2 = await _RepositoryApiClient.entriesClient.getFieldValuesNextLink({ nextLink, maxPageSize });
    expect(response2).not.toBeNull();
    expect(response2.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
  });

  test('Get Entry Links simple paging', async () => {
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    let response = await _RepositoryApiClient.entriesClient.getLinkValuesFromEntry({ repoId: repositoryId, entryId, prefer });
    expect(response).not.toBeNull();
    let nextLink = response.toJSON()['@odata.nextLink'];
    expect(nextLink).not.toBeNull();
    expect(response.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
    let response2 = await _RepositoryApiClient.entriesClient.getLinkValuesFromEntryNextLink({ nextLink, maxPageSize });
    expect(response2).not.toBeNull();
    expect(response2.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
  });

  test('Get Entry Listing simple paging', async () => {
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    let response = await _RepositoryApiClient.entriesClient.getEntryListing({ repoId: repositoryId, entryId, prefer });
    expect(response).not.toBeNull();
    let nextLink = response.toJSON()['@odata.nextLink'];
    expect(nextLink).not.toBeNull();
    expect(response.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
    let response2 = await _RepositoryApiClient.entriesClient.getEntryListingNextLink({ nextLink, maxPageSize });
    expect(response2).not.toBeNull();
    expect(response2.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
  });

  test('Get Entry Tags simple paging', async () => {
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    let response = await _RepositoryApiClient.entriesClient.getTagsAssignedToEntry({ repoId: repositoryId, entryId, prefer });
    expect(response).not.toBeNull();
    let nextLink = response.toJSON()['@odata.nextLink'];
    expect(nextLink).not.toBeNull();
    expect(response.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
    let response2 = await _RepositoryApiClient.entriesClient.getTagsAssignedToEntryNextLink({ nextLink, maxPageSize });
    expect(response2).not.toBeNull();
    expect(response2.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
  });
});
