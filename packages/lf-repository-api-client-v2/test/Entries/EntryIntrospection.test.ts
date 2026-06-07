// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  Folder,
  Document,
  FileParameter,
  ImportEntryRequest,
  StartDeleteEntryRequest,
} from '../../index.js';
import { SKIP_UNDER_JSDOM } from '../BaseTest.js';

const ROOT_FOLDER_ID = 1;

// REQ-DOC-002 opt-in introspection on Get Entry. childInfo is folder-only and uses no multipart
// upload, so it runs under jsdom; totalDocumentSize requires importing a document (Blob multipart),
// so it must be gated with SKIP_UNDER_JSDOM (TFS #658052).
describe('Entry Introspection - childInfo', () => {
  test('includeChildInfo returns a total plus per-type counts for the root folder immediate children', async () => {
    const entry = await _RepositoryApiClient.entriesClient.getEntry({
      repositoryId,
      entryId: ROOT_FOLDER_ID,
      includeChildInfo: true,
    });
    const folder = entry as Folder;
    expect(folder.childInfo).toBeDefined();
    expect(folder.childInfo).not.toBeNull();
    // Single object: a total plus the per-type breakdown.
    const ci = folder.childInfo!;
    expect(ci.childCount).toBe((ci.folderCount ?? 0) + (ci.documentCount ?? 0) + (ci.shortcutCount ?? 0));
    expect(ci.hasChildren).toBe((ci.childCount ?? 0) > 0);
    // The repository root reliably contains at least one child in our test environments.
    expect(ci.childCount ?? 0).toBeGreaterThan(0);
  });

  test('childInfo omitted when not requested', async () => {
    const entry = await _RepositoryApiClient.entriesClient.getEntry({
      repositoryId,
      entryId: ROOT_FOLDER_ID,
    });
    const folder = entry as Folder;
    expect(folder.childInfo).toBeUndefined();
  });
});

describe.skipIf(SKIP_UNDER_JSDOM)('Entry Introspection - totalDocumentSize', () => {
  let createdEntryId: number | undefined;

  afterEach(async () => {
    if (createdEntryId) {
      await _RepositoryApiClient.entriesClient.startDeleteEntry({
        repositoryId,
        entryId: createdEntryId,
        request: new StartDeleteEntryRequest(),
      });
      createdEntryId = undefined;
    }
  });

  async function importTestDocument(): Promise<number> {
    const blob = new Blob(['integration test content'], { type: 'application/pdf' });
    const request = new ImportEntryRequest();
    request.name = 'RepositoryApiClientIntegrationTest JS EntryIntrospection';
    request.autoRename = true;
    const edoc: FileParameter = { fileName: 'test.pdf', data: blob };
    const entry = await _RepositoryApiClient.entriesClient.importEntry({
      repositoryId,
      entryId: ROOT_FOLDER_ID,
      file: edoc,
      request,
    });
    return entry.id!;
  }

  test('includeTotalSize returns total >= electronic document size', async () => {
    createdEntryId = await importTestDocument();
    const entry = await _RepositoryApiClient.entriesClient.getEntry({
      repositoryId,
      entryId: createdEntryId,
      includeTotalSize: true,
    });
    const doc = entry as Document;
    expect(doc.totalDocumentSize).toBeDefined();
    expect(doc.totalDocumentSize).not.toBeNull();
    expect(doc.totalDocumentSize!).toBeGreaterThanOrEqual(doc.electronicDocumentSize ?? 0);
  });

  test('totalDocumentSize omitted when not requested', async () => {
    createdEntryId = await importTestDocument();
    const entry = await _RepositoryApiClient.entriesClient.getEntry({
      repositoryId,
      entryId: createdEntryId,
    });
    const doc = entry as Document;
    expect(doc.totalDocumentSize).toBeUndefined();
  });
});
