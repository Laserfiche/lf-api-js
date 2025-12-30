// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { Entry, StartDeleteEntryRequest, UpdateEntryRequest } from '../../index.js';
import { CreateEntry } from '../BaseTest.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Update Entries Integration Tests', () => {
  const createdEntries: Array<Entry> = [];
  afterEach(async () => {
    for (let i = 0; i < createdEntries.length; i++) {
      if (createdEntries[i]) {
        const body = new StartDeleteEntryRequest();
        const num = Number(createdEntries[i].id);
        await _RepositoryApiClient.entriesClient.startDeleteEntry({ repositoryId, entryId: num, request: body });
      }
    }
  });

  test('Rename Entry', async () => {
    const parentFolder: Entry = await CreateEntry(_RepositoryApiClient, 'RepositoryApiClientIntegrationTest JS ParentFolder');
    createdEntries.push(parentFolder);
    const childFolder: Entry = await CreateEntry(_RepositoryApiClient, 'RepositoryApiClientIntegrationTest JS ChildFolder');
    createdEntries.push(childFolder);

    const request = new UpdateEntryRequest();
    request.parentId = parentFolder.id;
    request.name = 'RepositoryApiClientIntegrationTest JS MovedFolder';
    request.autoRename = true;

    const movedEntry: Entry = await _RepositoryApiClient.entriesClient.updateEntry({
      repositoryId,
      entryId: childFolder.id ?? -1,
      request,
    });
    
    expect(movedEntry).not.toBeNull();
    expect(movedEntry.id).toBe(childFolder.id);
    expect(movedEntry.parentId).toBe(parentFolder.id);
    expect(movedEntry.name).toBe(request.name);
  });
});
