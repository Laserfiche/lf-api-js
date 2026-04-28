// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  Document,
  PagesContentRequest,
  MovePagesRequest,
  ImportEntryRequest,
  FileParameter,
  StartDeleteEntryRequest,
} from '../../index.js';

describe('movePages Integration Tests', () => {
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

  test('movePages reorders pages within a document', async () => {
    createdEntryId = await createEmptyDocument(
      'RepositoryApiClientIntegrationTest JS MovePages Reorder'
    );

    // Seed 3 distinguishable text pages
    const seed = new PagesContentRequest();
    seed.textPages = ['Page A', 'Page B', 'Page C'];
    await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId: createdEntryId,
      request: seed,
    });

    // Move page 1 ("Page A") to before position 3
    const moveRequest = new MovePagesRequest();
    moveRequest.pageRange = '1';
    moveRequest.destinationPageNumber = 3;

    const result = await _RepositoryApiClient.entriesClient.movePages({
      repositoryId,
      entryId: createdEntryId,
      request: moveRequest,
    });

    expect(result).not.toBeNull();
    expect(result.id).toBe(createdEntryId);
    expect((result as Document).pageCount).toBe(3);

    const pages = await _RepositoryApiClient.entriesClient.listPageInfos({
      repositoryId,
      entryId: createdEntryId,
    });
    expect(pages.length).toBe(3);
  });
});
