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
import { SKIP_UNDER_JSDOM } from '../BaseTest.js';

// All cases exercise the unified `writePage()` method. The split between
// image and text below is by argument shape (imageFile vs request), not by
// separate client methods.
describe.skipIf(SKIP_UNDER_JSDOM)('writePage Integration Tests', () => {
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

  test('writePage with imageFile replaces existing image page', async () => {
    createdEntryId = await createEmptyDocument(
      'RepositoryApiClientIntegrationTest JS WritePage Image'
    );

    // Create an image page first
    await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId: createdEntryId,
      imageFiles: [createPngFileParameter('original.png')],
    });

    // Replace the image on page 1
    const result = await _RepositoryApiClient.entriesClient.writePage({
      repositoryId,
      entryId: createdEntryId,
      pageNumber: 1,
      imageFile: createPngFileParameter('replacement.png'),
    });

    expect(result).not.toBeNull();
    expect(result.id).toBe(createdEntryId);
    expect((result as Document).pageCount).toBe(1);

    // Verify image can be retrieved
    const imageResult = await _RepositoryApiClient.entriesClient.getPageImage({
      repositoryId,
      entryId: createdEntryId,
      pageNumber: 1,
    });
    expect(imageResult).not.toBeNull();
    expect(imageResult.data).toBeDefined();
    expect(imageResult.data.size).toBeGreaterThan(0);
  });

  test('writePage with imageFile + generateText replaces image and OCRs', async () => {
    createdEntryId = await createEmptyDocument(
      'RepositoryApiClientIntegrationTest JS WritePage Image GenerateText'
    );

    // Create an image page first
    await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId: createdEntryId,
      imageFiles: [createPngFileParameter('original.png')],
    });

    // Replace with generateText
    const result = await _RepositoryApiClient.entriesClient.writePage({
      repositoryId,
      entryId: createdEntryId,
      pageNumber: 1,
      imageFile: createPngFileParameter('replacement.png'),
      generateText: true,
    });

    expect(result).not.toBeNull();
    expect(result.id).toBe(createdEntryId);
    expect((result as Document).pageCount).toBe(1);
  });

  test('writePage with text request replaces existing page text', async () => {
    createdEntryId = await createEmptyDocument(
      'RepositoryApiClientIntegrationTest JS WritePage Text'
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
