// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  ImportEntryRequest,
  FileParameter,
  StartDeleteEntryRequest,
  UpdateDocumentRequest,
  EntryType,
} from '../../index.js';
import { SKIP_UNDER_JSDOM } from '../BaseTest.js';

describe.skipIf(SKIP_UNDER_JSDOM)('Update Document Integration Tests', () => {
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
      const request = new StartDeleteEntryRequest();
      await _RepositoryApiClient.entriesClient.startDeleteEntry({
        repositoryId,
        entryId: createdEntryId,
        request,
      });
      createdEntryId = 0;
    }
  });

  test('UpdateDocument with file', async () => {
    createdEntryId = await createDocument('RepositoryApiClientIntegrationTest JS UpdateDocFile');

    const newContent = 'updated document content';
    const newBlob = new Blob([newContent], { type: 'text/plain' });
    const file: FileParameter = { fileName: 'updated.txt', data: newBlob };

    const updateRequest = new UpdateDocumentRequest();
    updateRequest.importAsElectronicDocument = true;

    const result = await _RepositoryApiClient.entriesClient.updateDocument({
      repositoryId,
      entryId: createdEntryId,
      file,
      request: updateRequest,
    });

    expect(result).not.toBeNull();
    expect(result.id).toBe(createdEntryId);
    expect(result.entryType).toBe(EntryType.Document);
  });

  test('UpdateDocument with file and metadata request', async () => {
    createdEntryId = await createDocument('RepositoryApiClientIntegrationTest JS UpdateDocMeta');

    const newContent = 'updated with metadata';
    const newBlob = new Blob([newContent], { type: 'text/plain' });
    const file: FileParameter = { fileName: 'updated.txt', data: newBlob };
    const updateRequest = new UpdateDocumentRequest();
    updateRequest.importAsElectronicDocument = true;

    const result = await _RepositoryApiClient.entriesClient.updateDocument({
      repositoryId,
      entryId: createdEntryId,
      file,
      request: updateRequest,
    });

    expect(result).not.toBeNull();
    expect(result.id).toBe(createdEntryId);
  });
});
