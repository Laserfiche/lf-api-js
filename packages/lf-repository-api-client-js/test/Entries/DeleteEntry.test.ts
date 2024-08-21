// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { CreateEntry } from '../BaseTest.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';
import { StartDeleteEntryRequest } from '../../index.js';

describe('Delete Entries Integration Tests', () => {
  test('Delete Entry', async () => {
    let deleteEntry = await CreateEntry(_RepositoryApiClient, 'RepositoryApiClientIntegrationTest JS DeleteFolder');
    let body: StartDeleteEntryRequest = new StartDeleteEntryRequest();
    let result = await _RepositoryApiClient.entriesClient.startDeleteEntry({
      repositoryId: repositoryId,
      entryId: deleteEntry.id ?? -1,
      request: body,
    });
    let taskId: string = result.taskId ?? '';
    
    expect(taskId).not.toBeNull();
    expect(taskId).not.toBe('');
  });
});
