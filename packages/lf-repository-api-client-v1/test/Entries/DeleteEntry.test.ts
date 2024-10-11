// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { CreateEntry } from '../BaseTest.js';
import { DeleteEntryWithAuditReason } from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

let token: string | undefined = undefined;

describe('Delete Entries Integration Tests', () => {
  beforeEach(async () => {
    token = undefined;
  });
  afterEach(async () => {
    await new Promise((r) => setTimeout(r, 5000));
    if (token) {
      try {
        await _RepositoryApiClient.tasksClient.cancelOperation({
          repoId: repositoryId,
          operationToken: token,
        });
      } catch {
        // don't do anything if task is already deleted
      }
    }
  });
  test('Delete Entry', async () => {
    let deleteEntry = await CreateEntry(
      _RepositoryApiClient,
      'RepositoryApiClientIntegrationTest JS DeleteFolder'
    );
    let body: DeleteEntryWithAuditReason = new DeleteEntryWithAuditReason();
    let result = await _RepositoryApiClient.entriesClient.deleteEntryInfo({
      repoId: repositoryId,
      entryId: deleteEntry.id ?? -1,
      request: body,
    });
    token = result.token ?? '';
    expect(token).not.toBeNull();
    expect(token).not.toBe('');
  });
});
