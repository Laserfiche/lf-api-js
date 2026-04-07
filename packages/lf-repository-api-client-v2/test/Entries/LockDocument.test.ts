// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  LockDocumentRequest,
  ImportEntryRequest,
  FileParameter,
  StartDeleteEntryRequest,
} from '../../index.js';

describe('Lock Document Integration Tests', () => {
  let createdEntryId: number = 0;

  async function createDocument(name: string): Promise<number> {
    const blob = new Blob(['test content'], { type: 'text/plain' });
    const request = new ImportEntryRequest();
    request.name = name;
    request.autoRename = true;
    const file: FileParameter = { fileName: name + '.txt', data: blob };
    const entry = await _RepositoryApiClient.entriesClient.importEntry({
      repositoryId,
      entryId: 1,
      file,
      request,
    });
    return entry.id!;
  }

  afterEach(async () => {
    if (createdEntryId !== 0) {
      try {
        // Ensure unlocked before delete
        await _RepositoryApiClient.entriesClient.unlockDocument({
          repositoryId,
          entryId: createdEntryId,
        });
      } catch {
        // Ignore if not locked
      }
      const request = new StartDeleteEntryRequest();
      await _RepositoryApiClient.entriesClient.startDeleteEntry({
        repositoryId,
        entryId: createdEntryId,
        request,
      });
      createdEntryId = 0;
    }
  });

  test('Lock then GetLockInfo then Unlock', async () => {
    createdEntryId = await createDocument('RepositoryApiClientIntegrationTest JS LockDocument');

    // Lock
    const lockRequest = new LockDocumentRequest();
    lockRequest.comment = 'client test lock';
    lockRequest.extent = 'All';
    const lockResult = await _RepositoryApiClient.entriesClient.lockDocument({
      repositoryId,
      entryId: createdEntryId,
      request: lockRequest,
    });

    expect(lockResult).not.toBeNull();
    expect(lockResult.isActive).toBe(true);
    expect(lockResult.lockToken).toBeDefined();
    expect(lockResult.comment).toBe('client test lock');
    expect(lockResult.entryId).toBe(createdEntryId);

    // Get lock info
    const lockInfo = await _RepositoryApiClient.entriesClient.getDocumentLockInfo({
      repositoryId,
      entryId: createdEntryId,
    });

    expect(lockInfo).not.toBeNull();
    expect(lockInfo.isActive).toBe(true);
    expect(lockInfo.lockToken).toBe(lockResult.lockToken);

    // Unlock
    await _RepositoryApiClient.entriesClient.unlockDocument({
      repositoryId,
      entryId: createdEntryId,
    });

    // Verify unlocked
    const afterUnlock = await _RepositoryApiClient.entriesClient.getDocumentLockInfo({
      repositoryId,
      entryId: createdEntryId,
    });

    expect(afterUnlock.isActive).toBe(false);
  });

  test('Unlock by token', async () => {
    createdEntryId = await createDocument('RepositoryApiClientIntegrationTest JS UnlockByToken');

    const lockRequest = new LockDocumentRequest();
    lockRequest.extent = 'All';
    const lockResult = await _RepositoryApiClient.entriesClient.lockDocument({
      repositoryId,
      entryId: createdEntryId,
      request: lockRequest,
    });

    // Unlock by token
    await _RepositoryApiClient.entriesClient.unlockDocument({
      repositoryId,
      entryId: createdEntryId,
      lockToken: lockResult.lockToken!,
    });

    const afterUnlock = await _RepositoryApiClient.entriesClient.getDocumentLockInfo({
      repositoryId,
      entryId: createdEntryId,
    });

    expect(afterUnlock.isActive).toBe(false);
  });

  test('GetDocumentLockInfo when not locked returns inactive', async () => {
    createdEntryId = await createDocument('RepositoryApiClientIntegrationTest JS GetLockNotLocked');

    const lockInfo = await _RepositoryApiClient.entriesClient.getDocumentLockInfo({
      repositoryId,
      entryId: createdEntryId,
    });

    expect(lockInfo).not.toBeNull();
    expect(lockInfo.isActive).toBe(false);
  });
});
