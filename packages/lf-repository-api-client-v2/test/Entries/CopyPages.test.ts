// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  Document,
  PagesContentRequest,
  CopyPagesRequest,
  ImportEntryRequest,
  FileParameter,
  StartDeleteEntryRequest,
} from '../../index.js';

describe('copyPages Integration Tests', () => {
  const createdEntryIds: number[] = [];

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
    const id = entry.id!;
    createdEntryIds.push(id);
    return id;
  }

  afterEach(async () => {
    for (const id of createdEntryIds.splice(0)) {
      try {
        const request = new StartDeleteEntryRequest();
        await _RepositoryApiClient.entriesClient.startDeleteEntry({
          repositoryId,
          entryId: id,
          request,
        });
      } catch {
        // best-effort cleanup
      }
    }
  });

  test('copyPages copies pages and source retains its pages', async () => {
    const sourceId = await createEmptyDocument(
      'RepositoryApiClientIntegrationTest JS CopyPages Source'
    );
    const destId = await createEmptyDocument(
      'RepositoryApiClientIntegrationTest JS CopyPages Dest'
    );

    // Seed source with 2 text pages
    const seed = new PagesContentRequest();
    seed.textPages = ['Source page 1', 'Source page 2'];
    await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId: sourceId,
      request: seed,
    });

    // Copy pages 1-2 from source into dest at position 1
    const copyRequest = new CopyPagesRequest();
    copyRequest.pageRange = '1-2';
    copyRequest.destinationEntryId = destId;
    copyRequest.destinationPageNumber = 1;

    const result = await _RepositoryApiClient.entriesClient.copyPages({
      repositoryId,
      entryId: sourceId,
      request: copyRequest,
    });

    expect(result).not.toBeNull();

    // Destination has the 2 copied pages
    const destPages = (await _RepositoryApiClient.entriesClient.listPageInfos({
      repositoryId,
      entryId: destId,
    })).value!;
    expect(destPages.length).toBe(2);

    // Source still has its 2 pages — copyPages does NOT transfer (renamed
    // from TransferPages with this behavior change)
    const sourcePages = (await _RepositoryApiClient.entriesClient.listPageInfos({
      repositoryId,
      entryId: sourceId,
    })).value!;
    expect(sourcePages.length).toBe(2);
  });
});
