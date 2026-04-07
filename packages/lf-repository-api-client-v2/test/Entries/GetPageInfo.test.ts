// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  AppendTextPageRequest,
  ImportEntryRequest,
  FileParameter,
  StartDeleteEntryRequest,
} from '../../index.js';

describe('Get Page Info Integration Tests', () => {
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

    // Append a text page
    const appendRequest = new AppendTextPageRequest();
    appendRequest.text = text;
    await _RepositoryApiClient.entriesClient.appendTextPage({
      repositoryId,
      entryId,
      request: appendRequest,
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

  test('GetPageInfo returns page info', async () => {
    createdEntryId = await createDocumentWithTextPage(
      'RepositoryApiClientIntegrationTest JS GetPageInfo',
      'Page info test content'
    );

    const pageInfo = await _RepositoryApiClient.entriesClient.getPageInfo({
      repositoryId,
      entryId: createdEntryId,
      pageNumber: 1,
    });

    expect(pageInfo).not.toBeNull();
    expect(pageInfo.pageNumber).toBe(1);
    expect(pageInfo.entryId).toBe(createdEntryId);
    expect(pageInfo.pageId).toBeGreaterThan(0);
  });

  test('GetPageInfo invalid page number throws exception', async () => {
    createdEntryId = await createDocumentWithTextPage(
      'RepositoryApiClientIntegrationTest JS GetPageInfo404',
      'test'
    );

    try {
      await _RepositoryApiClient.entriesClient.getPageInfo({
        repositoryId,
        entryId: createdEntryId,
        pageNumber: 9999,
      });
      throw new Error('Should have thrown');
    } catch (e: any) {
      expect(e.status === 400 || e.status === 404).toBe(true);
    }
  });

  test('GetPageInfo entry not found throws 404', async () => {
    try {
      await _RepositoryApiClient.entriesClient.getPageInfo({
        repositoryId,
        entryId: 999999999,
        pageNumber: 1,
      });
      throw new Error('Should have thrown');
    } catch (e: any) {
      expect(e.status).toBe(404);
    }
  });
});

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
      const appendRequest = new AppendTextPageRequest();
      appendRequest.text = text;
      await _RepositoryApiClient.entriesClient.appendTextPage({
        repositoryId,
        entryId,
        request: appendRequest,
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

  test('ListPageInfos consistent with GetPageInfo', async () => {
    createdEntryId = await createDocumentWithPages(
      'RepositoryApiClientIntegrationTest JS ListPageInfosConsistent',
      ['Consistency test content']
    );

    const pages = await _RepositoryApiClient.entriesClient.listPageInfos({
      repositoryId,
      entryId: createdEntryId,
    });

    expect(pages.length).toBeGreaterThan(0);

    const singlePageInfo = await _RepositoryApiClient.entriesClient.getPageInfo({
      repositoryId,
      entryId: createdEntryId,
      pageNumber: 1,
    });

    const firstPage = pages.find((p) => p.pageNumber === 1)!;
    expect(firstPage.pageId).toBe(singlePageInfo.pageId);
    expect(firstPage.hasImage).toBe(singlePageInfo.hasImage);
    expect(firstPage.hasText).toBe(singlePageInfo.hasText);
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
