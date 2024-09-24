// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId, authorizationType } from '../TestHelper.js';
import { authorizationTypeEnum } from '../AuthorizationType.js';
import { DeleteEntryWithAuditReason, Entry, PutLinksRequest, WEntryLinkInfo } from '../../index.js';
import { CreateEntry } from '../BaseTest.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Set Entries Integration Tests', () => {
  let createdEntries: Array<Entry> = new Array();

  afterEach(async () => {
    for (let i = 0; i < createdEntries.length; i++) {
      if (createdEntries[i]) {
        let body: DeleteEntryWithAuditReason = new DeleteEntryWithAuditReason();
        let num: number = Number(createdEntries[i].id);
        await _RepositoryApiClient.entriesClient.deleteEntryInfo({ repoId: repositoryId, entryId: num, request: body });
      }
    }
    createdEntries = [];
    if (authorizationType === authorizationTypeEnum.CloudAccessKey) {
      _RepositoryApiClient.serverSessionClient.invalidateServerSession({ repoId: repositoryId });
    }
  });

  test('Set Links', async () => {
    let sourceEntry: Entry = await CreateEntry(
      _RepositoryApiClient,
      'RepositoryApiClientIntegrationTest JS SetLinks Source'
    );
    createdEntries.push(sourceEntry);
    var targetEntry = await CreateEntry(_RepositoryApiClient, 'RepositoryApiClientIntegrationTest JS SetLinks Target');
    createdEntries.push(targetEntry);
    let putLinks = new PutLinksRequest();
    putLinks.targetId = targetEntry.id;
    putLinks.linkTypeId = 1;
    let request = new Array<PutLinksRequest>(putLinks);
    let result = await _RepositoryApiClient.entriesClient.assignEntryLinks({
      repoId: repositoryId,
      entryId: sourceEntry.id ?? -1,
      linksToAdd: request,
    });

    let links: WEntryLinkInfo[] | undefined = result.value;
    if (!links) {
      throw new Error('links is undefined');
    }
    expect(links).not.toBeNull();
    expect(request.length).toBe(links.length);
    expect(sourceEntry.id).toBe(links[0].sourceId);
    expect(targetEntry.id).toBe(links[0].targetId);
  });
});
