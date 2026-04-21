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

describe('List Page Infos Integration Tests', () => {
  let createdEntryId: number = 0;

  async function createDocumentWithPages(name: string, pageTexts: string[]): Promise<number> {
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

    for (const text of pageTexts) {
      const createPagesRequest = new CreatePagesRequest();
      createPagesRequest.textPages = [text];
      await _RepositoryApiClient.entriesClient.createPages({
        repositoryId,
        entryId,
        request: createPagesRequest,
      });
    }

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

  test('ListPageInfos returns all pages', async () => {
    createdEntryId = await createDocumentWithPages(
      'RepositoryApiClientIntegrationTest JS ListPageInfos',
      ['Page 1 content', 'Page 2 content']
    );

    const pages = await _RepositoryApiClient.entriesClient.listPageInfos({
      repositoryId,
      entryId: createdEntryId,
    });

    expect(pages).not.toBeNull();
    expect(pages.length).toBe(2);
    for (let i = 0; i < pages.length; i++) {
      expect(pages[i].pageNumber).toBe(i + 1);
      expect(pages[i].entryId).toBe(createdEntryId);
      expect(pages[i].pageId).toBeGreaterThan(0);
    }
  });

  test('ListPageInfos with pageRange returns filtered pages', async () => {
    createdEntryId = await createDocumentWithPages(
      'RepositoryApiClientIntegrationTest JS ListPageInfos PageRange',
      ['Page 1', 'Page 2', 'Page 3']
    );

    const pages = await _RepositoryApiClient.entriesClient.listPageInfos({
      repositoryId,
      entryId: createdEntryId,
      pageRange: '1-2',
    });

    expect(pages).not.toBeNull();
    expect(pages.length).toBe(2);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[1].pageNumber).toBe(2);
  });

  test('ListPageInfos with single page range returns one page', async () => {
    createdEntryId = await createDocumentWithPages(
      'RepositoryApiClientIntegrationTest JS ListPageInfos SinglePage',
      ['Page 1', 'Page 2']
    );

    const pages = await _RepositoryApiClient.entriesClient.listPageInfos({
      repositoryId,
      entryId: createdEntryId,
      pageRange: '2',
    });

    expect(pages).not.toBeNull();
    expect(pages.length).toBe(1);
    expect(pages[0].pageNumber).toBe(2);
    expect(pages[0].entryId).toBe(createdEntryId);
  });

  test('ListPageInfos entry not found throws 404', async () => {
    try {
      await _RepositoryApiClient.entriesClient.listPageInfos({
        repositoryId,
        entryId: 999999999,
      });
      throw new Error('Should have thrown');
    } catch (e: any) {
      expect(e.status).toBe(404);
    }
  });
});
