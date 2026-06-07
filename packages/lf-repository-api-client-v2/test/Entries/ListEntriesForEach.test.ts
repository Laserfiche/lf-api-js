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

// These tests page over the repository root (entry 1). The suite does not control how many
// fields/links/tags the root carries, so they only assert paging invariants when the server
// actually returns another page (odataNextLink present) — tolerant of an entry that has no
// such items. Mirrors the dotnet ForEach integration tests. Deterministic next-link coverage
// for links lives in the self-sufficient SimplePaging test in ListEntriesNextLink.test.ts.
describe('List Entry Tests', () => {
  let entryId: number = 1;

  test('List Entries ForEach', async () => {
    let maxPages = 3;
    let maxPageSize = 10;
    let pages = 0;
    const callback = async (response: EntryCollectionResponse) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      if (response.odataNextLink) {
        expect(response.value.length).toBeGreaterThan(0);
        expect(response.value.length).toBeLessThanOrEqual(maxPageSize);
      }
      pages += 1;
      return maxPages > pages;
    };

    await _RepositoryApiClient.entriesClient.listEntriesForEach({ callback, repositoryId, entryId, maxPageSize });

    expect(pages).toBeGreaterThan(0);
  });

  test('List Fields ForEach', async () => {
    let maxPages = 3;
    let maxPageSize = 10;
    let pages = 0;
    const callback = async (response: FieldCollectionResponse) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      if (response.odataNextLink) {
        expect(response.value.length).toBeGreaterThan(0);
        expect(response.value.length).toBeLessThanOrEqual(maxPageSize);
      }
      pages += 1;
      return maxPages > pages;
    };

    await _RepositoryApiClient.entriesClient.listFieldsForEach({ callback, repositoryId, entryId, maxPageSize });

    expect(pages).toBeGreaterThan(0);
  });

  test('List Links ForEach', async () => {
    let maxPages = 3;
    let maxPageSize = 10;
    let pages = 0;
    const callback = async (response: LinkCollectionResponse) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      if (response.odataNextLink) {
        expect(response.value.length).toBeGreaterThan(0);
        expect(response.value.length).toBeLessThanOrEqual(maxPageSize);
      }
      pages += 1;
      return maxPages > pages;
    };

    await _RepositoryApiClient.entriesClient.listLinksForEach({ callback, repositoryId, entryId, maxPageSize });

    expect(pages).toBeGreaterThan(0);
  });

  test('List Tags ForEach', async () => {
    let maxPages = 3;
    let maxPageSize = 10;
    let pages = 0;
    const callback = async (response: TagDefinitionCollectionResponse) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      if (response.odataNextLink) {
        expect(response.value.length).toBeGreaterThan(0);
        expect(response.value.length).toBeLessThanOrEqual(maxPageSize);
      }
      pages += 1;
      return maxPages > pages;
    };

    await _RepositoryApiClient.entriesClient.listTagsForEach({ callback, repositoryId, entryId, maxPageSize });

    expect(pages).toBeGreaterThan(0);
  });
});
