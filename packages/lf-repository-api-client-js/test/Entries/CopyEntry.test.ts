// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import {
  CopyEntryRequest,
  CreateEntryRequest,
  CreateEntryRequestEntryType,
  Entry,
  EntryType,
  StartDeleteEntryRequest,
} from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Copy Entry Test', () => {
  let testFolder: Entry | null = null;

  afterEach(async () => {
    if (testFolder != null) {
      let body: StartDeleteEntryRequest = new StartDeleteEntryRequest();
      await _RepositoryApiClient.entriesClient.startDeleteEntry({ repositoryId: repositoryId, entryId: testFolder.id!, request: body });
    }
    testFolder = null;
  });

  test('Copy Shortcut', async () => {
    // Create new entry
    let newEntryName: string = 'RepositoryApiClientIntegrationTest JS CreateFolder';
    let parentEntryId: number = 1;
    let request: CreateEntryRequest = new CreateEntryRequest();
    request.entryType = CreateEntryRequestEntryType.Folder;
    request.name = newEntryName;
    request.autoRename = true;
    
    let response = await _RepositoryApiClient.entriesClient.createEntry({
      repositoryId: repositoryId,
      entryId: parentEntryId,
      request,
    });
    
    let targetEntry: Entry = response;
    
    expect(targetEntry).not.toBeNull();
    
    testFolder = targetEntry;
    
    expect(parentEntryId).toBe(targetEntry.parentId);
    expect(EntryType.Folder).toBe(targetEntry.entryType);

    // Create a shortcut to the new entry
    newEntryName = 'RepositoryApiClientIntegrationTest JS CreateShortcut';
    request = new CreateEntryRequest();
    request.entryType = CreateEntryRequestEntryType.Shortcut;
    request.name = newEntryName;
    request.targetId = targetEntry.id;
    request.autoRename = true;
    
    response = await _RepositoryApiClient.entriesClient.createEntry({
      repositoryId: repositoryId,
      entryId: testFolder.id!,
      request,
    });
    
    let shortcut: Entry = response;
    
    expect(shortcut).not.toBeNull();
    expect(testFolder.id!).toBe(shortcut.parentId);
    expect(EntryType.Shortcut).toBe(shortcut.entryType);

    // Copy Entry
    let copyRequest = new CopyEntryRequest();
    copyRequest.name = 'RepositoryApiClientIntegrationTest JS CopiedEntry';
    copyRequest.sourceId = shortcut.id!;
    copyRequest.autoRename = true;
    
    let newEntry: Entry = await _RepositoryApiClient.entriesClient.copyEntry({
      repositoryId: repositoryId,
      entryId: testFolder.id!,
      request: copyRequest,
    });
    
    expect(newEntry.parentId).toBe(testFolder.id!);
    expect(newEntry.entryType).toBe(shortcut.entryType);
  });
});
