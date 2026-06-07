// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import {
  FieldCollectionResponse,
  EntryCollectionResponse,
  LinkCollectionResponse,
  TagDefinitionCollectionResponse
} from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import { setupPagingEntries, PagingTestEntries } from '../PagingTestData.js';

describe('List Entry Tests', () => {
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

  test('List Entries ForEach', async () => {
    let entryId = data.entriesFolderId;
    let maxPages = 3;
    let maxPageSize = 10;
    let entries = 0;
    let pages = 0;
    const callback = async (response: EntryCollectionResponse) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      entries += response.value.length;
      pages += 1;
      return maxPages > pages;
    };

    await _RepositoryApiClient.entriesClient.listEntriesForEach({ callback, repositoryId, entryId, maxPageSize });

    expect(entries).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });

  test('List Fields ForEach', async () => {
    let entryId = data.fieldsEntryId;
    let maxPages = 3;
    let maxPageSize = 10;
    let entries = 0;
    let pages = 0;
    const callback = async (response: FieldCollectionResponse) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      entries += response.value.length;
      pages += 1;
      return maxPages > pages;
    };

    await _RepositoryApiClient.entriesClient.listFieldsForEach({ callback, repositoryId, entryId, maxPageSize });

    expect(entries).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });

  test('List Links ForEach', async () => {
    let entryId = data.linksEntryId;
    let maxPages = 3;
    let maxPageSize = 10;
    let entries = 0;
    let pages = 0;
    const callback = async (response: LinkCollectionResponse) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      entries += response.value.length;
      pages += 1;
      return maxPages > pages;
    };

    await _RepositoryApiClient.entriesClient.listLinksForEach({ callback, repositoryId, entryId, maxPageSize });

    expect(entries).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });

  test('List Tags ForEach', async () => {
    let entryId = data.tagsEntryId;
    let maxPages = 3;
    let maxPageSize = 10;
    let entries = 0;
    let pages = 0;
    const callback = async (response: TagDefinitionCollectionResponse) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      entries += response.value.length;
      pages += 1;
      return maxPages > pages;
    };

    await _RepositoryApiClient.entriesClient.listTagsForEach({ callback, repositoryId, entryId, maxPageSize });

    expect(entries).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });
});
