// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  CheckOutDocumentRequest,
  ImportEntryRequest,
  FileParameter,
  StartDeleteEntryRequest,
} from '../../index.js';

describe('Check In Check Out Integration Tests', () => {
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
        await _RepositoryApiClient.entriesClient.undoCheckOut({
          repositoryId,
          entryId: createdEntryId,
        });
      } catch {
        // Ignore if not checked out
      }
      try {
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

  test('PutUnderVersionControl then CheckOut then CheckIn', async () => {
    createdEntryId = await createDocument('RepositoryApiClientIntegrationTest JS CICO');

    // Put under version control
    const vcResult = await _RepositoryApiClient.entriesClient.putUnderVersionControl({
      repositoryId,
      entryId: createdEntryId,
    });

    expect(vcResult).not.toBeNull();
    expect(vcResult.id).toBe(createdEntryId);

    // Check out with lock
    const checkOutRequest = new CheckOutDocumentRequest();
    checkOutRequest.lock = true;
    checkOutRequest.comment = 'client test checkout';
    const checkOutResult = await _RepositoryApiClient.entriesClient.checkOutDocument({
      repositoryId,
      entryId: createdEntryId,
      request: checkOutRequest,
    });

    expect(checkOutResult).not.toBeNull();
    expect(checkOutResult.id).toBe(createdEntryId);

    // Check in
    const checkInResult = await _RepositoryApiClient.entriesClient.checkInDocument({
      repositoryId,
      entryId: createdEntryId,
    });

    expect(checkInResult).not.toBeNull();
    expect(checkInResult.id).toBe(createdEntryId);

    // Verify lock released
    const lockInfo = await _RepositoryApiClient.entriesClient.getDocumentLockInfo({
      repositoryId,
      entryId: createdEntryId,
    });

    expect(lockInfo.isActive).toBe(false);
  });

  test('CheckOut with lock then UndoCheckOut releases lock', async () => {
    createdEntryId = await createDocument('RepositoryApiClientIntegrationTest JS UndoCheckOut');

    await _RepositoryApiClient.entriesClient.putUnderVersionControl({
      repositoryId,
      entryId: createdEntryId,
    });

    const checkOutRequest = new CheckOutDocumentRequest();
    checkOutRequest.lock = true;
    await _RepositoryApiClient.entriesClient.checkOutDocument({
      repositoryId,
      entryId: createdEntryId,
      request: checkOutRequest,
    });

    // Verify locked
    const lockInfo = await _RepositoryApiClient.entriesClient.getDocumentLockInfo({
      repositoryId,
      entryId: createdEntryId,
    });
    expect(lockInfo.isActive).toBe(true);

    // Undo checkout
    const undoResult = await _RepositoryApiClient.entriesClient.undoCheckOut({
      repositoryId,
      entryId: createdEntryId,
    });

    expect(undoResult).not.toBeNull();

    // Verify unlocked
    const afterUndo = await _RepositoryApiClient.entriesClient.getDocumentLockInfo({
      repositoryId,
      entryId: createdEntryId,
    });
    expect(afterUndo.isActive).toBe(false);
  });

  test('CheckOut without lock', async () => {
    createdEntryId = await createDocument('RepositoryApiClientIntegrationTest JS CheckOutNoLock');

    await _RepositoryApiClient.entriesClient.putUnderVersionControl({
      repositoryId,
      entryId: createdEntryId,
    });

    const checkOutRequest = new CheckOutDocumentRequest();
    checkOutRequest.lock = false;
    await _RepositoryApiClient.entriesClient.checkOutDocument({
      repositoryId,
      entryId: createdEntryId,
      request: checkOutRequest,
    });

    // Verify not locked
    const lockInfo = await _RepositoryApiClient.entriesClient.getDocumentLockInfo({
      repositoryId,
      entryId: createdEntryId,
    });
    expect(lockInfo.isActive).toBe(false);

    // Cleanup
    await _RepositoryApiClient.entriesClient.undoCheckOut({
      repositoryId,
      entryId: createdEntryId,
    });
  });

  test('PutUnderVersionControl already under VC is no-op', async () => {
    createdEntryId = await createDocument('RepositoryApiClientIntegrationTest JS VCNoOp');

    await _RepositoryApiClient.entriesClient.putUnderVersionControl({
      repositoryId,
      entryId: createdEntryId,
    });

    // Call again — should succeed without error
    const result = await _RepositoryApiClient.entriesClient.putUnderVersionControl({
      repositoryId,
      entryId: createdEntryId,
    });

    expect(result).not.toBeNull();
    expect(result.id).toBe(createdEntryId);
  });
});
