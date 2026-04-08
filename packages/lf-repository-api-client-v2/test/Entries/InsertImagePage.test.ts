// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  Document,
  AppendTextPageRequest,
  ImportEntryRequest,
  FileParameter,
  StartDeleteEntryRequest,
} from '../../index.js';

describe('Insert Image Page Integration Tests', () => {
  let createdEntryId: number = 0;

  async function createDocumentWithTextPages(name: string, pageCount: number): Promise<number> {
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
    const entryId = entry.id!;

    for (let i = 0; i < pageCount; i++) {
      const appendRequest = new AppendTextPageRequest();
      appendRequest.text = `Page ${i + 1} content`;
      await _RepositoryApiClient.entriesClient.appendTextPage({
        repositoryId,
        entryId,
        request: appendRequest,
      });
    }

    return entryId;
  }

  function createPngFileParameter(name: string): FileParameter {
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
      0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
    const blob = new Blob([pngBytes], { type: 'image/png' });
    return { fileName: name, data: blob };
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

  test('InsertImagePage single file', async () => {
    createdEntryId = await createDocumentWithTextPages(
      'RepositoryApiClientIntegrationTest JS InsertImagePage',
      1
    );

    const result = await _RepositoryApiClient.entriesClient.insertImagePage({
      repositoryId,
      entryId: createdEntryId,
      pageNumber: 1,
      imageFiles: [createPngFileParameter('test.png')],
    });

    expect(result).not.toBeNull();
    expect(result.id).toBe(createdEntryId);
    expect((result as Document).pageCount).toBe(2);
  });

  test('InsertImagePage multiple files', async () => {
    createdEntryId = await createDocumentWithTextPages(
      'RepositoryApiClientIntegrationTest JS InsertImagePageMultiple',
      2
    );

    const result = await _RepositoryApiClient.entriesClient.insertImagePage({
      repositoryId,
      entryId: createdEntryId,
      pageNumber: 1,
      imageFiles: [
        createPngFileParameter('insert1.png'),
        createPngFileParameter('insert2.png'),
      ],
    });

    expect(result).not.toBeNull();
    expect(result.id).toBe(createdEntryId);
    expect((result as Document).pageCount).toBe(4);
  });
});
