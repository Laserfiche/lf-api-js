// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import {
  CreateEntryRequest,
  CreateEntryRequestEntryType,
  Entry,
  EntryType,
  Shortcut,
  StartDeleteEntryRequest,
} from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Create Entry Tests', () => {
  let testFolder: Entry | null = null;

  afterEach(async () => {
    if (testFolder != null) {
      let body: StartDeleteEntryRequest = new StartDeleteEntryRequest();
      await _RepositoryApiClient.entriesClient.startDeleteEntry({ repositoryId: repositoryId, entryId: testFolder.id!, request: body });
    }
    testFolder = null;
  });

  test('Create Folder', async () => {
    let newEntryName: string = 'RepositoryApiClientIntegrationTest JS CreateFolder';
    let parentEntryId: number = 1;
    let request: CreateEntryRequest = new CreateEntryRequest();
    request.entryType = CreateEntryRequestEntryType.Folder;
    request.name = newEntryName;
    request.autoRename = true;
    
    let response: Entry = await _RepositoryApiClient.entriesClient.createEntry({
      repositoryId: repositoryId,
      entryId: parentEntryId,
      request,
    });
    
    let entry: Entry = response;
    
    expect(entry).not.toBeNull();
    
    testFolder = entry;
    
    expect(parentEntryId).toBe(entry.parentId);
    expect(EntryType.Folder).toBe(entry.entryType);
    expect(typeof EntryType).toBe(typeof entry);
  });

  test('Create Shortcut', async () => {
    // Create new entry
    let newEntryName: string = 'RepositoryApiClientIntegrationTest JS CreateFolder';
    let parentEntryId: number = 1;
    let request: CreateEntryRequest = new CreateEntryRequest();
    request.entryType = CreateEntryRequestEntryType.Folder;
    request.name = newEntryName;
    request.autoRename = true;
    
    let response: Entry = await _RepositoryApiClient.entriesClient.createEntry({
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
      entryId: targetEntry.id!,
      request,
    });
    
    let shortcut: Shortcut = response;
    
    expect(shortcut).not.toBeNull();
    expect(targetEntry.id).toBe(shortcut.parentId);
    expect(EntryType.Shortcut).toBe(shortcut.entryType);
  });
});
