// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import {
  DeleteEntryWithAuditReason,
  Entry,
  EntryType,
  PostEntryChildrenEntryType,
  PostEntryChildrenRequest,
} from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Create Copy Entry Test', () => {
  let createdEntries: Array<Entry> = new Array();

  afterEach(async () => {
    for (let i = 0; i < createdEntries.length; i++) {
      if (createdEntries[i]) {
        let body: DeleteEntryWithAuditReason = new DeleteEntryWithAuditReason();
        let num: number = Number(createdEntries[i].id);
        await _RepositoryApiClient.entriesClient.deleteEntryInfo({ repoId: repositoryId, entryId: num, request: body });
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
    createdEntries = [];
  });

  test('Create Copy Entry Copy Shortcut', async () => {
    //Create new entry
    let newEntryName: string = 'RepositoryApiClientIntegrationTest JS CreateFolder';
    let parentEntryId: number = 1;
    let request: PostEntryChildrenRequest = new PostEntryChildrenRequest();
    request.entryType = PostEntryChildrenEntryType.Folder;
    request.name = newEntryName;
    let response = await _RepositoryApiClient.entriesClient.createOrCopyEntry({
      repoId: repositoryId,
      entryId: parentEntryId,
      request,
      autoRename: true,
    });
    let targetEntry: Entry = response;
    expect(targetEntry).not.toBeNull();
    createdEntries.push(targetEntry);
    expect(parentEntryId).toBe(targetEntry.parentId);
    expect(EntryType.Folder).toBe(targetEntry.entryType);

    //create a shortcut to the new entry
    newEntryName = 'RepositoryApiClientIntegrationTest JS CreateShortcut';
    request = new PostEntryChildrenRequest();
    request.entryType = PostEntryChildrenEntryType.Shortcut;
    request.name = newEntryName;
    request.targetId = targetEntry.id;
    response = await _RepositoryApiClient.entriesClient.createOrCopyEntry({
      repoId: repositoryId,
      entryId: parentEntryId,
      request,
      autoRename: true,
    });
    let shortcut: Entry = response;
    expect(shortcut).not.toBeNull();
    createdEntries.push(shortcut);
    expect(parentEntryId).toBe(shortcut.parentId);
    expect(EntryType.Shortcut).toBe(shortcut.entryType);

    //Copy Entry
    request = new PostEntryChildrenRequest();
    request.name = 'RepositoryApiClientIntegrationTest JS CopiedEntry';
    request.sourceId = shortcut.id;
    let newEntry: Entry = await _RepositoryApiClient.entriesClient.createOrCopyEntry({
      repoId: repositoryId,
      entryId: parentEntryId,
      request,
      autoRename: true,
    });
    createdEntries.push(newEntry);
    expect(newEntry.parentId).toBe(parentEntryId);
    expect(newEntry.entryType).toBe(shortcut.entryType);
  });
});
