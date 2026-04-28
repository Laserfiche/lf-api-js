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

describe('replacePages Integration Tests', () => {
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

  test('replacePages replaces all existing pages with new content', async () => {
    createdEntryId = await createEmptyDocument(
      'RepositoryApiClientIntegrationTest JS ReplacePages'
    );

    // Seed 2 text pages
    const seed = new PagesContentRequest();
    seed.textPages = ['Original A', 'Original B'];
    await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId: createdEntryId,
      request: seed,
    });

    // Replace all pages with 1 image page + 1 text page
    const replacement = new PagesContentRequest();
    replacement.textPages = ['', 'Replacement text'];
    const result = await _RepositoryApiClient.entriesClient.replacePages({
      repositoryId,
      entryId: createdEntryId,
      imageFiles: [createPngFileParameter('replacement.png')],
      request: replacement,
    });

    expect(result).not.toBeNull();
    expect(result.id).toBe(createdEntryId);
    expect((result as Document).pageCount).toBe(2);

    // The replacement text on page 2 is set; page 1's image was replaced
    const pageText = await _RepositoryApiClient.entriesClient.getPageText({
      repositoryId,
      entryId: createdEntryId,
      pageNumber: 2,
    });
    expect(pageText.text).toBe('Replacement text');
  });
});
