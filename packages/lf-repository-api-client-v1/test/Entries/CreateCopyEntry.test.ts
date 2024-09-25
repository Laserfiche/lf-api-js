// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import {
  DeleteEntryWithAuditReason,
  Entry,
  EntryType,
  PostEntryChildrenEntryType,
  PostEntryChildrenRequest,
  Shortcut,
} from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Create Copy Entry Tests', () => {
  let createdEntries: Array<Entry> = new Array();
  let tokens: string[] = [];

  afterEach(async () => {
    for (let i = 0; i < createdEntries.length; i++) {
      if (createdEntries[i]) {
        let body: DeleteEntryWithAuditReason = new DeleteEntryWithAuditReason();
        let num: number = Number(createdEntries[i].id);
        await _RepositoryApiClient.entriesClient.deleteEntryInfo({ repoId: repositoryId, entryId: num, request: body });
        let deleteOp = await _RepositoryApiClient.entriesClient.deleteEntryInfo({ repoId: repositoryId, entryId: num, request: body });
        if (deleteOp.token) tokens.push(deleteOp.token);
      }
    }
    for (const token of tokens) {
      try {
        await _RepositoryApiClient.tasksClient.cancelOperation({
          repoId: repositoryId,
          operationToken: token,
        });
      } catch {
        // don't do anything if task is already deleted
      }
    }
    createdEntries = [];
  });

  test('Create Copy Entry Create Folder', async () => {
    let newEntryName: string = 'RepositoryApiClientIntegrationTest JS CreateFolder';
    let parentEntryId: number = 1;
    let request: PostEntryChildrenRequest = new PostEntryChildrenRequest();
    request.entryType = PostEntryChildrenEntryType.Folder;
    request.name = newEntryName;
    let response: Entry = await _RepositoryApiClient.entriesClient.createOrCopyEntry({
      repoId: repositoryId,
      entryId: parentEntryId,
      request,
      autoRename: true,
    });
    let entry: Entry = response;
    expect(entry).not.toBeNull();
    createdEntries.push(entry);
    expect(parentEntryId).toBe(entry.parentId);
    expect(EntryType.Folder).toBe(entry.entryType);
    expect(typeof EntryType).toBe(typeof entry);
  });

  test('Create Copy Entry Create Shortcut', async () => {
    //Create new entry
    let newEntryName: string = 'RepositoryApiClientIntegrationTest JS CreateFolder';
    let parentEntryId: number = 1;
    let request: PostEntryChildrenRequest = new PostEntryChildrenRequest();
    request.entryType = PostEntryChildrenEntryType.Folder;
    request.name = newEntryName;
    let response: Entry = await _RepositoryApiClient.entriesClient.createOrCopyEntry({
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
    let shortcut: Shortcut = response;
    expect(shortcut).not.toBeNull();
    createdEntries.push(shortcut);
    expect(parentEntryId).toBe(shortcut.parentId);
    expect(EntryType.Shortcut).toBe(shortcut.entryType);
  });
});
