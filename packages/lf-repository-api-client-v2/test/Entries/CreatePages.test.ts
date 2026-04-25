// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  Document,
  PagesContentRequest,
  ImportEntryRequest,
  FileParameter,
  StartDeleteEntryRequest,
} from '../../index.js';

describe('CreatePages Integration Tests', () => {
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

  test('CreatePages with image file', async () => {
    createdEntryId = await createEmptyDocument(
      'RepositoryApiClientIntegrationTest JS CreatePages ImageFile'
    );

    const result = await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId: createdEntryId,
      imageFiles: [createPngFileParameter('test.png')],
    });

    expect(result).not.toBeNull();
    expect(result.id).toBe(createdEntryId);
    expect((result as Document).pageCount).toBe(1);
  });

  test('CreatePages with multiple image files', async () => {
    createdEntryId = await createEmptyDocument(
      'RepositoryApiClientIntegrationTest JS CreatePages MultipleImageFiles'
    );

    const result = await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId: createdEntryId,
      imageFiles: [
        createPngFileParameter('test1.png'),
        createPngFileParameter('test2.png'),
        createPngFileParameter('test3.png'),
      ],
    });

    expect(result).not.toBeNull();
    expect(result.id).toBe(createdEntryId);
    expect((result as Document).pageCount).toBe(3);
  });

  test('CreatePages with text only', async () => {
    createdEntryId = await createEmptyDocument(
      'RepositoryApiClientIntegrationTest JS CreatePages TextOnly'
    );

    const createPagesRequest = new PagesContentRequest();
    createPagesRequest.textPages = ['Hello world integration test'];

    const result = await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId: createdEntryId,
      request: createPagesRequest,
    });

    expect(result).not.toBeNull();
    expect(result.id).toBe(createdEntryId);
    expect((result as Document).pageCount).toBe(1);
  });

  test('CreatePages empty page', async () => {
    createdEntryId = await createEmptyDocument(
      'RepositoryApiClientIntegrationTest JS CreatePages EmptyPage'
    );

    const req = new PagesContentRequest();
    req.textPages = [''];
    const result = await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId: createdEntryId,
      request: req,
    });

    expect(result).not.toBeNull();
    expect(result.id).toBe(createdEntryId);
    expect((result as Document).pageCount).toBe(1);
  });

  test('CreatePages empty pages with count', async () => {
    createdEntryId = await createEmptyDocument(
      'RepositoryApiClientIntegrationTest JS CreatePages EmptyCount3'
    );

    const req = new PagesContentRequest();
    req.textPages = ['', '', ''];
    const result = await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId: createdEntryId,
      request: req,
    });

    expect(result).not.toBeNull();
    expect(result.id).toBe(createdEntryId);
    expect((result as Document).pageCount).toBe(3);
  });

  test('CreatePages with pageNumber inserts', async () => {
    createdEntryId = await createEmptyDocument(
      'RepositoryApiClientIntegrationTest JS CreatePages Insert'
    );

    // Create an initial text page
    const req = new PagesContentRequest();
    req.textPages = ['Original page'];
    await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId: createdEntryId,
      request: req,
    });

    // Insert image page at position 1
    const result = await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId: createdEntryId,
      pageNumber: 1,
      imageFiles: [createPngFileParameter('insert.png')],
    });

    expect(result).not.toBeNull();
    expect((result as Document).pageCount).toBe(2);
  });

  test('CreatePages single image and text', async () => {
    createdEntryId = await createEmptyDocument(
      'RepositoryApiClientIntegrationTest JS CreatePages ImageAndText'
    );

    const req = new PagesContentRequest();
    req.textPages = ['Page with both image and text'];
    const result = await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId: createdEntryId,
      imageFiles: [createPngFileParameter('test.png')],
      request: req,
    });

    expect(result).not.toBeNull();
    expect((result as Document).pageCount).toBe(1);

    // Verify page has both parts
    const pages = await _RepositoryApiClient.entriesClient.listPageInfos({
      repositoryId,
      entryId: createdEntryId,
    });
    expect(pages.length).toBe(1);
    expect(pages[0].hasImage).toBe(true);
    expect(pages[0].hasText).toBe(true);
  });

  test('CreatePages with generateText', async () => {
    createdEntryId = await createEmptyDocument(
      'RepositoryApiClientIntegrationTest JS CreatePages GenerateText'
    );

    const result = await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId: createdEntryId,
      imageFiles: [createPngFileParameter('test.png')],
      generateText: true,
    });

    expect(result).not.toBeNull();
    expect((result as Document).pageCount).toBe(1);
  });
});
