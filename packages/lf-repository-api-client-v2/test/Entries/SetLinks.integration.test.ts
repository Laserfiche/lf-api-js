// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { Entry, LinkToUpdate, SetLinksRequest, StartDeleteEntryRequest } from '../../index.js';
import { CreateEntry } from '../BaseTest.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Set Entries Integration Tests', () => {
  let testFolder: Entry | null = null;

  afterEach(async () => {
    if (testFolder != null) {
      const request = new StartDeleteEntryRequest();
      await _RepositoryApiClient.entriesClient.startDeleteEntry({ repositoryId, entryId: testFolder.id!, request });
    }
    testFolder = null;
  });

  test('Set Links', async () => {
    const sourceEntry: Entry = await CreateEntry(
      _RepositoryApiClient,
      'RepositoryApiClientIntegrationTest JS SetLinks Source'
    );
    
    testFolder = sourceEntry;
    const targetEntry = await CreateEntry(_RepositoryApiClient, 'RepositoryApiClientIntegrationTest JS SetLinks Target', sourceEntry.id!);
    
    const request = new SetLinksRequest();
    const linkToUpdate = new LinkToUpdate();
    linkToUpdate.linkDefinitionId = 1;
    linkToUpdate.otherEntryId = targetEntry.id!;
    request.links = [linkToUpdate];
    
    const result = await _RepositoryApiClient.entriesClient.setLinks({
      repositoryId,
      entryId: sourceEntry.id ?? -1,
      request,
    });

    const links = result.value!;
    
    expect(links).not.toBeNull();
    expect(request.links!.length).toBe(links.length);
    expect(sourceEntry.id).toBe(links[0].sourceId);
    expect(targetEntry.id).toBe(links[0].targetId);
  });
});
