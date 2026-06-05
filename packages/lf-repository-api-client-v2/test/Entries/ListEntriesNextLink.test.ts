// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import { setupPagingEntries, PagingTestEntries } from '../PagingTestData.js';

describe('Get Entry Next Links Tests', () => {
  // These tests create their own entries (populated with >= 2 children/fields/links/tags)
  // rather than relying on metadata pre-configured on the repository root folder.
  let data: PagingTestEntries;

  beforeAll(async () => {
    data = await setupPagingEntries(_RepositoryApiClient);
  }, 120000);

  afterAll(async () => {
    if (data) {
      await data.cleanup();
    }
  });

  test('List Fields simple paging', async () => {
    let entryId = data.fieldsEntryId;
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    let response = await _RepositoryApiClient.entriesClient.listFields({ repositoryId, entryId, prefer });

    expect(response).not.toBeNull();

    let nextLink = response.odataNextLink!;

    expect(nextLink).not.toBeNull();
    expect(response.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);

    let response2 = await _RepositoryApiClient.entriesClient.listFieldsNextLink({ nextLink, maxPageSize });

    expect(response2).not.toBeNull();
    expect(response2.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
  });

  test('List Links simple paging', async () => {
    let entryId = data.linksEntryId;
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    let response = await _RepositoryApiClient.entriesClient.listLinks({ repositoryId, entryId, prefer });

    expect(response).not.toBeNull();

    let nextLink = response.odataNextLink!;

    expect(nextLink).not.toBeNull();
    expect(response.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);

    let response2 = await _RepositoryApiClient.entriesClient.listLinksNextLink({ nextLink, maxPageSize });

    expect(response2).not.toBeNull();
    expect(response2.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
  });

  test('List Entries simple paging', async () => {
    let entryId = data.entriesFolderId;
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    let response = await _RepositoryApiClient.entriesClient.listEntries({ repositoryId, entryId, prefer });

    expect(response).not.toBeNull();

    let nextLink = response.odataNextLink!;

    expect(nextLink).not.toBeNull();
    expect(response.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);

    let response2 = await _RepositoryApiClient.entriesClient.listEntriesNextLink({ nextLink, maxPageSize });

    expect(response2).not.toBeNull();
    expect(response2.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
  });

  test('List Tags simple paging', async () => {
    let entryId = data.tagsEntryId;
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    let response = await _RepositoryApiClient.entriesClient.listTags({ repositoryId, entryId, prefer });

    expect(response).not.toBeNull();

    let nextLink = response.odataNextLink!;

    expect(nextLink).not.toBeNull();
    expect(response.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);

    let response2 = await _RepositoryApiClient.entriesClient.listTagsNextLink({ nextLink, maxPageSize });

    expect(response2).not.toBeNull();
    expect(response2.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
  });
});
