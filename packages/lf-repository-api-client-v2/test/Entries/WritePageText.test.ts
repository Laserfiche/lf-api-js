// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  Document,
  PagesContentRequest,
  WritePageTextRequest,
  ImportEntryRequest,
  FileParameter,
  StartDeleteEntryRequest,
} from '../../index.js';

describe('WritePageText Integration Tests', () => {
  let createdEntryId: number = 0;

  async function createEmptyDocument(name: string): Promise<number> {
    const blob = new Blob([''], { type: 'text/plain' });
    const importRequest = new ImportEntryRequest();
    importRequest.name = name;
    importRequest.autoRename = true;
    const file: FileParameter = { fileName: name + '.txt', data: blob };
    const entry = await _RepositoryApiClient.entriesClient.importEntry({
      repositoryId,
      entryId: 1,
      file,
      request: importRequest,
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

  test('WritePageText replaces text', async () => {
    createdEntryId = await createEmptyDocument(
      'RepositoryApiClientIntegrationTest JS WritePageText'
    );

    const createPagesRequest = new PagesContentRequest();
    createPagesRequest.textPages = ['Original text content'];
    await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId: createdEntryId,
      request: createPagesRequest,
    });

    const writeRequest = new WritePageTextRequest();
    writeRequest.text = 'Replaced text content';
    const result = await _RepositoryApiClient.entriesClient.writePage({
      repositoryId,
      entryId: createdEntryId,
      pageNumber: 1,
      request: writeRequest,
    });

    expect(result).not.toBeNull();
    expect(result.id).toBe(createdEntryId);
    expect((result as Document).pageCount).toBe(1);

    const pageText = await _RepositoryApiClient.entriesClient.getPageText({
      repositoryId,
      entryId: createdEntryId,
      pageNumber: 1,
    });

    expect(pageText).not.toBeNull();
    expect(pageText.text).toBe('Replaced text content');
  });
});
