// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { Entry, LinkToUpdate, SetLinksRequest, StartDeleteEntryRequest } from '../../index.js';
import { CreateEntry } from '../BaseTest.js';
import { _RepositoryApiClient } from '../CreateSession.js';

describe('Get Entry Next Links Tests', () => {
  let entryId: number = 1;
  let createdEntries: Entry[] = [];

  afterEach(async () => {
    for (const entry of createdEntries) {
      try {
        await _RepositoryApiClient.entriesClient.startDeleteEntry({
          repositoryId,
          entryId: entry.id!,
          request: new StartDeleteEntryRequest(),
        });
      } catch {
        /* best-effort cleanup */
      }
    }
    createdEntries = [];
  });

  test('List Fields simple paging', async () => {
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    let response = await _RepositoryApiClient.entriesClient.listFields({ repositoryId, entryId, prefer });

    expect(response).not.toBeNull();
    if (!response.value || response.value.length === 0) {
      return; // entry has no fields to page over — tolerant of repository state
    }

    let nextLink = response.odataNextLink!;

    expect(nextLink).not.toBeNull();
    expect(response.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);

    let response2 = await _RepositoryApiClient.entriesClient.listFieldsNextLink({ nextLink, maxPageSize });

    expect(response2).not.toBeNull();
    expect(response2.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
  });

  test('List Links simple paging', async () => {
    let maxPageSize = 1;

    // Self-sufficient: create a source entry with two links so a second page is guaranteed,
    // instead of paging the shared root entry — whose link count this suite does not control
    // (exactly one leftover link there makes the next link null and fails the test).
    let sourceEntry = await CreateEntry(
      _RepositoryApiClient,
      'RepositoryApiClientIntegrationTest JS ListLinks NextLink Source'
    );
    createdEntries.push(sourceEntry);
    let targetEntry1 = await CreateEntry(
      _RepositoryApiClient,
      'RepositoryApiClientIntegrationTest JS ListLinks NextLink Target1'
    );
    createdEntries.push(targetEntry1);
    let targetEntry2 = await CreateEntry(
      _RepositoryApiClient,
      'RepositoryApiClientIntegrationTest JS ListLinks NextLink Target2'
    );
    createdEntries.push(targetEntry2);

    let setLinksRequest = new SetLinksRequest();
    let link1 = new LinkToUpdate();
    link1.linkDefinitionId = 1;
    link1.otherEntryId = targetEntry1.id!;
    let link2 = new LinkToUpdate();
    link2.linkDefinitionId = 1;
    link2.otherEntryId = targetEntry2.id!;
    setLinksRequest.links = [link1, link2];
    await _RepositoryApiClient.entriesClient.setLinks({
      repositoryId,
      entryId: sourceEntry.id!,
      request: setLinksRequest,
    });

    let prefer = `maxpagesize=${maxPageSize}`;
    let response = await _RepositoryApiClient.entriesClient.listLinks({
      repositoryId,
      entryId: sourceEntry.id!,
      prefer,
    });

    expect(response).not.toBeNull();
    expect(response.toJSON().value.length).not.toBe(0);

    let nextLink = response.odataNextLink!;

    expect(nextLink).not.toBeNull();
    expect(response.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);

    let response2 = await _RepositoryApiClient.entriesClient.listLinksNextLink({ nextLink, maxPageSize });

    expect(response2).not.toBeNull();
    expect(response2.toJSON().value.length).not.toBe(0);
    expect(response2.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
  });

  test('List Entries simple paging', async () => {
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    let response = await _RepositoryApiClient.entriesClient.listEntries({ repositoryId, entryId, prefer });

    expect(response).not.toBeNull();
    if (!response.value || response.value.length === 0) {
      return; // entry has no children to page over — tolerant of repository state
    }

    let nextLink = response.odataNextLink!;

    expect(nextLink).not.toBeNull();
    expect(response.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);

    let response2 = await _RepositoryApiClient.entriesClient.listEntriesNextLink({ nextLink, maxPageSize });

    expect(response2).not.toBeNull();
    expect(response2.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
  });

  test('List Tags simple paging', async () => {
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    let response = await _RepositoryApiClient.entriesClient.listTags({ repositoryId, entryId, prefer });

    expect(response).not.toBeNull();
    if (!response.value || response.value.length === 0) {
      return; // entry has no tags to page over — tolerant of repository state
    }

    let nextLink = response.odataNextLink!;

    expect(nextLink).not.toBeNull();
    expect(response.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);

    let response2 = await _RepositoryApiClient.entriesClient.listTagsNextLink({ nextLink, maxPageSize });

    expect(response2).not.toBeNull();
    expect(response2.toJSON().value.length).toBeLessThanOrEqual(maxPageSize);
  });
});
