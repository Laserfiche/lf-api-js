// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { DeleteEntryWithAuditReason, Entry, PatchEntryRequest } from '../../index.js';
import { CreateEntry } from '../BaseTest.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Move Entries Integration Tests', () => {
  let createdEntries: Array<Entry> = new Array();
  afterEach(async () => {
    for (let i = 0; i < createdEntries.length; i++) {
      if (createdEntries[i]) {
        let body = new DeleteEntryWithAuditReason();
        let num = Number(createdEntries[i].id);
        await _RepositoryApiClient.entriesClient.deleteEntryInfo({ repoId: repositoryId, entryId: num, request: body });
      }
    }
  });

  test('Move and Rename Entry', async () => {
    let parentFolder: Entry = await CreateEntry(_RepositoryApiClient, 'RepositoryApiClientIntegrationTest JS ParentFolder');
    createdEntries.push(parentFolder);
    let childFolder: Entry = await CreateEntry(_RepositoryApiClient, 'RepositoryApiClientIntegrationTest JS ChildFolder');
    createdEntries.push(childFolder);

    let request = new PatchEntryRequest();
    request.parentId = parentFolder.id;
    request.name = 'RepositoryApiClientIntegrationTest JS MovedFolder';

    let movedEntry: Entry = await _RepositoryApiClient.entriesClient.moveOrRenameEntry({
      repoId: repositoryId,
      entryId: childFolder.id ?? -1,
      request,
      autoRename: true,
    });
    expect(movedEntry).not.toBeNull();
    expect(movedEntry.id).toBe(childFolder.id);
    expect(movedEntry.parentId).toBe(parentFolder.id);
    expect(movedEntry.name).toBe(request.name);
  });
});
