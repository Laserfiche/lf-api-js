// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  PagesContentRequest,
  ImportEntryRequest,
  FileParameter,
  StartDeleteEntryRequest,
} from '../../index.js';
import { SKIP_UNDER_JSDOM } from '../BaseTest.js';

describe.skipIf(SKIP_UNDER_JSDOM)('List Page Infos Integration Tests', () => {
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
      const createPagesRequest = new PagesContentRequest();
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

    const result = await _RepositoryApiClient.entriesClient.listPageInfos({
      repositoryId,
      entryId: createdEntryId,
    });

    expect(result).not.toBeNull();
    expect(result.value).not.toBeNull();
    const pages = result.value!;
    expect(pages.length).toBe(2);
    for (let i = 0; i < pages.length; i++) {
      expect(pages[i].pageNumber).toBe(i + 1);
      expect(pages[i].entryId).toBe(createdEntryId);
      expect(pages[i].pageId).toBeGreaterThan(0);
    }
    // Small doc fits in default PageSize=150, so no nextLink
    expect(result.odataNextLink).toBeUndefined();
  });

  test('ListPageInfos with pageRange returns filtered pages', async () => {
    createdEntryId = await createDocumentWithPages(
      'RepositoryApiClientIntegrationTest JS ListPageInfos PageRange',
      ['Page 1', 'Page 2', 'Page 3']
    );

    const result = await _RepositoryApiClient.entriesClient.listPageInfos({
      repositoryId,
      entryId: createdEntryId,
      pageRange: '1-2',
    });

    expect(result).not.toBeNull();
    const pages = result.value!;
    expect(pages.length).toBe(2);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[1].pageNumber).toBe(2);
  });

  test('ListPageInfos with single page range returns one page', async () => {
    createdEntryId = await createDocumentWithPages(
      'RepositoryApiClientIntegrationTest JS ListPageInfos SinglePage',
      ['Page 1', 'Page 2']
    );

    const result = await _RepositoryApiClient.entriesClient.listPageInfos({
      repositoryId,
      entryId: createdEntryId,
      pageRange: '2',
    });

    expect(result).not.toBeNull();
    const pages = result.value!;
    expect(pages.length).toBe(1);
    expect(pages[0].pageNumber).toBe(2);
    expect(pages[0].entryId).toBe(createdEntryId);
  });

  test('ListPageInfos with $count populates odataCount', async () => {
    createdEntryId = await createDocumentWithPages(
      'RepositoryApiClientIntegrationTest JS ListPageInfos Count',
      ['Page 1', 'Page 2', 'Page 3']
    );

    const result = await _RepositoryApiClient.entriesClient.listPageInfos({
      repositoryId,
      entryId: createdEntryId,
      count: true,
    });

    expect(result.odataCount).toBe(3);
    expect(result.value!.length).toBe(3);
  });

  test('ListPageInfos with $top limits items', async () => {
    createdEntryId = await createDocumentWithPages(
      'RepositoryApiClientIntegrationTest JS ListPageInfos Top',
      ['Page 1', 'Page 2', 'Page 3', 'Page 4']
    );

    const result = await _RepositoryApiClient.entriesClient.listPageInfos({
      repositoryId,
      entryId: createdEntryId,
      top: 2,
    });

    const pages = result.value!;
    expect(pages.length).toBe(2);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[1].pageNumber).toBe(2);
  });

  test('ListPageInfos pageRange and $top compose', async () => {
    createdEntryId = await createDocumentWithPages(
      'RepositoryApiClientIntegrationTest JS ListPageInfos PageRangeTop',
      ['Page 1', 'Page 2', 'Page 3', 'Page 4', 'Page 5']
    );

    // pageRange="2-4" pre-filters (3 pages); $top=2 trims
    const result = await _RepositoryApiClient.entriesClient.listPageInfos({
      repositoryId,
      entryId: createdEntryId,
      pageRange: '2-4',
      top: 2,
    });

    const pages = result.value!;
    expect(pages.length).toBe(2);
    expect(pages[0].pageNumber).toBe(2);
    expect(pages[1].pageNumber).toBe(3);
  });

  test('ListPageInfos Prefer maxpagesize triggers nextLink', async () => {
    createdEntryId = await createDocumentWithPages(
      'RepositoryApiClientIntegrationTest JS ListPageInfos Prefer',
      ['Page 1', 'Page 2', 'Page 3']
    );

    const result = await _RepositoryApiClient.entriesClient.listPageInfos({
      repositoryId,
      entryId: createdEntryId,
      prefer: 'odata.maxpagesize=2',
    });

    expect(result.value!.length).toBe(2);
    expect(result.odataNextLink).toBeDefined();
  });

  test('ListPageInfos invalid pageRange returns 400', async () => {
    createdEntryId = await createDocumentWithPages(
      'RepositoryApiClientIntegrationTest JS ListPageInfos InvalidRange',
      ['Page 1', 'Page 2']
    );

    try {
      await _RepositoryApiClient.entriesClient.listPageInfos({
        repositoryId,
        entryId: createdEntryId,
        pageRange: 'abc',
      });
      throw new Error('Should have thrown');
    } catch (e: any) {
      expect(e.status).toBe(400);
    }
  });

  test('ListPageInfos out-of-range pageRange returns 400', async () => {
    createdEntryId = await createDocumentWithPages(
      'RepositoryApiClientIntegrationTest JS ListPageInfos OutOfRange',
      ['Page 1', 'Page 2']
    );

    try {
      await _RepositoryApiClient.entriesClient.listPageInfos({
        repositoryId,
        entryId: createdEntryId,
        pageRange: '1-10',
      });
      throw new Error('Should have thrown');
    } catch (e: any) {
      expect(e.status).toBe(400);
    }
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
