// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  ImportEntryRequest,
  FileParameter,
  StartDeleteEntryRequest,
  UpdateDocumentRequest,
} from '../../index.js';

describe('Get Document Integration Tests', () => {
  let createdEntryId: number = 0;

  async function createEmptyDocument(name: string): Promise<number> {
    const blob = new Blob([''], { type: 'text/plain' });
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

  test('GetDocument returns edoc stream', async () => {
    createdEntryId = await createEmptyDocument('RepositoryApiClientIntegrationTest JS GetDocument');

    // Write an edoc first via updateDocument
    const pdfContent = '%PDF-1.4 test content';
    const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
    const pdfFile: FileParameter = { fileName: 'test.pdf', data: pdfBlob };
    const updateRequest = new UpdateDocumentRequest();
    updateRequest.importAsElectronicDocument = true;
    await _RepositoryApiClient.entriesClient.updateDocument({
      repositoryId,
      entryId: createdEntryId,
      file: pdfFile,
      request: updateRequest,
    });

    // Download the edoc
    const result = await _RepositoryApiClient.entriesClient.getDocument({
      repositoryId,
      entryId: createdEntryId,
    });

    expect(result).not.toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data.size).toBeGreaterThan(0);
  });

  test('GetDocument no edoc throws exception', async () => {
    // Create a document by importing an empty file (matches .NET CreateEmptyDocument pattern)
    const request = new ImportEntryRequest();
    request.name = 'RepositoryApiClientIntegrationTest JS GetDocumentNoEdoc';
    request.autoRename = true;
    const emptyBlob = new Blob([], { type: 'application/octet-stream' });
    const file: FileParameter = { fileName: request.name, data: emptyBlob };
    const entry = await _RepositoryApiClient.entriesClient.importEntry({
      repositoryId,
      entryId: 1,
      file,
      request,
    });
    createdEntryId = entry.id!;

    try {
      await _RepositoryApiClient.entriesClient.getDocument({
        repositoryId,
        entryId: createdEntryId,
      });
      throw new Error('Should have thrown');
    } catch (e: any) {
      expect(e.status).toBeDefined();
    }
  });
});
