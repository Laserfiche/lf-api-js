// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { Entry, StartDeleteEntryRequest, UpdateEntryRequest } from '../../index.js';
import { CreateEntry } from '../BaseTest.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Update Entries Integration Tests', () => {
  let createdEntries: Array<Entry> = new Array();
  afterEach(async () => {
    for (let i = 0; i < createdEntries.length; i++) {
      if (createdEntries[i]) {
        let body = new StartDeleteEntryRequest();
        let num = Number(createdEntries[i].id);
        await _RepositoryApiClient.entriesClient.startDeleteEntry({ repositoryId, entryId: num, request: body });
      }
    }
  });

  test('Rename Entry', async () => {
    let parentFolder: Entry = await CreateEntry(_RepositoryApiClient, 'RepositoryApiClientIntegrationTest JS ParentFolder');
    createdEntries.push(parentFolder);
    let childFolder: Entry = await CreateEntry(_RepositoryApiClient, 'RepositoryApiClientIntegrationTest JS ChildFolder');
    createdEntries.push(childFolder);

    let request = new UpdateEntryRequest();
    request.parentId = parentFolder.id;
    request.name = 'RepositoryApiClientIntegrationTest JS MovedFolder';
    request.autoRename = true;

    let movedEntry: Entry = await _RepositoryApiClient.entriesClient.updateEntry({
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
