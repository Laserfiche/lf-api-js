// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  CreatePagesRequest,
  ImportEntryRequest,
  FileParameter,
  StartDeleteEntryRequest,
} from '../../index.js';

describe('Get Page Content Integration Tests', () => {
  let createdEntryId: number = 0;

  async function createDocumentWithTextPage(name: string, text: string): Promise<number> {
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

    const createPagesRequest = new CreatePagesRequest();
    createPagesRequest.textPages = [text];
    await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId,
      request: createPagesRequest,
    });

    return entryId;
  }

  async function createDocumentWithImagePage(name: string): Promise<number> {
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

    // 1x1 white PNG
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
      0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
    const imageBlob = new Blob([pngBytes], { type: 'image/png' });
    const imageFile: FileParameter = { fileName: 'test.png', data: imageBlob };
    await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId,
      imageFiles: [imageFile],
    });

    return entryId;
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

  test('GetPageText returns text content', async () => {
    const expectedText = 'Hello world integration test';
    createdEntryId = await createDocumentWithTextPage(
      'RepositoryApiClientIntegrationTest JS GetPageText',
      expectedText
    );

    const result = await _RepositoryApiClient.entriesClient.getPageText({
      repositoryId,
      entryId: createdEntryId,
      pageNumber: 1,
    });

    expect(result).not.toBeNull();
    expect(result.text).toBe(expectedText);
  });

  test('GetPageImage returns image data', async () => {
    createdEntryId = await createDocumentWithImagePage(
      'RepositoryApiClientIntegrationTest JS GetPageImage'
    );

    const result = await _RepositoryApiClient.entriesClient.getPageImage({
      repositoryId,
      entryId: createdEntryId,
      pageNumber: 1,
    });

    expect(result).not.toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data.size).toBeGreaterThan(0);
  });

  test('GetPageImage non-existent page throws exception', async () => {
    createdEntryId = await createDocumentWithImagePage(
      'RepositoryApiClientIntegrationTest JS GetPageImage404'
    );

    try {
      await _RepositoryApiClient.entriesClient.getPageImage({
        repositoryId,
        entryId: createdEntryId,
        pageNumber: 999,
      });
      throw new Error('Should have thrown');
    } catch (e: any) {
      expect(e.status === 400 || e.status === 404).toBe(true);
    }
  });

  test('GenerateText succeeds', async () => {
    createdEntryId = await createDocumentWithImagePage(
      'RepositoryApiClientIntegrationTest JS GenerateText'
    );

    const result = await _RepositoryApiClient.entriesClient.generateText({
      repositoryId,
      entryId: createdEntryId,
    });

    expect(result).not.toBeNull();
    expect(result.id).toBe(createdEntryId);
  });
});
