// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Get Entry Next Links Tests', () => {
  const entryId: number = 1;

  test('Get Entry Field simple paging', async () => {
    const maxPageSize = 1;
    const prefer = `maxpagesize=${maxPageSize}`;
    const response = await _RepositoryApiClient.entriesClient.getFieldValues({ repoId: repositoryId, entryId, prefer });
    expect(response).not.toBeNull();
    const nextLink = response.toJSON()['@odata.nextLink'];
    expect(nextLink).not.toBeNull();
    expect(response.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
    const response2 = await _RepositoryApiClient.entriesClient.getFieldValuesNextLink({ nextLink, maxPageSize });
    expect(response2).not.toBeNull();
    expect(response2.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
  });

  test('Get Entry Links simple paging', async () => {
    const maxPageSize = 1;
    const prefer = `maxpagesize=${maxPageSize}`;
    const response = await _RepositoryApiClient.entriesClient.getLinkValuesFromEntry({ repoId: repositoryId, entryId, prefer });
    expect(response).not.toBeNull();
    const nextLink = response.toJSON()['@odata.nextLink'];
    expect(nextLink).not.toBeNull();
    expect(response.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
    const response2 = await _RepositoryApiClient.entriesClient.getLinkValuesFromEntryNextLink({ nextLink, maxPageSize });
    expect(response2).not.toBeNull();
    expect(response2.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
  });

  test('Get Entry Listing simple paging', async () => {
    const maxPageSize = 1;
    const prefer = `maxpagesize=${maxPageSize}`;
    const response = await _RepositoryApiClient.entriesClient.getEntryListing({ repoId: repositoryId, entryId, prefer });
    expect(response).not.toBeNull();
    const nextLink = response.toJSON()['@odata.nextLink'];
    expect(nextLink).not.toBeNull();
    expect(response.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
    const response2 = await _RepositoryApiClient.entriesClient.getEntryListingNextLink({ nextLink, maxPageSize });
    expect(response2).not.toBeNull();
    expect(response2.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
  });

  test('Get Entry Tags simple paging', async () => {
    const maxPageSize = 1;
    const prefer = `maxpagesize=${maxPageSize}`;
    const response = await _RepositoryApiClient.entriesClient.getTagsAssignedToEntry({ repoId: repositoryId, entryId, prefer });
    expect(response).not.toBeNull();
    const nextLink = response.toJSON()['@odata.nextLink'];
    expect(nextLink).not.toBeNull();
    expect(response.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
    const response2 = await _RepositoryApiClient.entriesClient.getTagsAssignedToEntryNextLink({ nextLink, maxPageSize });
    expect(response2).not.toBeNull();
    expect(response2.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
  });
});
