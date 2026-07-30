// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  CreateEntryRequest,
  CreateEntryRequestEntryType,
  Entry,
  FileParameter,
  ImportEntryRequest,
  StartDeleteEntryRequest,
} from '../../index.js';
import { getDeleteEntryAuditReasonId, SKIP_UNDER_JSDOM } from '../BaseTest.js';

// Integration tests for the recursive folder-path ("mkdir -p") feature on
// POST /Folder/Import / importEntry (#687491): the optional `folderPath` request-body property
// (relative to the route entry) plus the `autoCreateFolderPath` query flag, exercised through the
// JS client. importEntry sends a Blob in a multipart body, so the whole suite is gated with
// SKIP_UNDER_JSDOM (vitest+jsdom multipart-fetch hang, TFS #658052) and runs under node only.
// These validate that the JS client threads `folderPath` through the multipart form and appends
// the query flag correctly on the OData route.
describe.skipIf(SKIP_UNDER_JSDOM)('Import Entry - Folder Path', () => {
  let rootId: number | undefined;

  afterEach(async () => {
    if (rootId) {
      const request = new StartDeleteEntryRequest();
      request.auditReasonId = await getDeleteEntryAuditReasonId(_RepositoryApiClient);
      await _RepositoryApiClient.entriesClient.startDeleteEntry({ repositoryId, entryId: rootId, request });
      rootId = undefined;
    }
  });

  async function newRoot(): Promise<{ id: number; name: string }> {
    const name = `APIServer_JS_ImportFolderPath_${crypto.randomUUID().replace(/-/g, '')}`;
    const request = new CreateEntryRequest();
    request.entryType = CreateEntryRequestEntryType.Folder;
    request.name = name;
    request.autoRename = false;
    const entry = await _RepositoryApiClient.entriesClient.createEntry({ repositoryId, entryId: 1, request });
    rootId = entry.id!;
    return { id: entry.id!, name };
  }

  async function makeFolder(parentId: number, name: string): Promise<Entry> {
    const request = new CreateEntryRequest();
    request.entryType = CreateEntryRequestEntryType.Folder;
    request.name = name;
    return await _RepositoryApiClient.entriesClient.createEntry({ repositoryId, entryId: parentId, request });
  }

  async function importDoc(
    entryId: number,
    name: string,
    autoRename: boolean,
    folderPath: string | undefined,
    autoCreateFolderPath: boolean | undefined
  ): Promise<Entry> {
    const blob = new Blob(['integration test content'], { type: 'application/pdf' });
    const request = new ImportEntryRequest();
    request.name = name;
    request.autoRename = autoRename;
    request.folderPath = folderPath;
    const edoc: FileParameter = { fileName: 'test.pdf', data: blob };
    return await _RepositoryApiClient.entriesClient.importEntry({
      repositoryId,
      entryId,
      file: edoc,
      request,
      autoCreateFolderPath,
    });
  }

  // GetEntryByPath uses backslash separators; normalize the forward-slash paths built for readability.
  async function getByPath(fullPath: string): Promise<Entry> {
    const response = await _RepositoryApiClient.entriesClient.getEntryByPath({
      repositoryId,
      fullPath: fullPath.replace(/\//g, '\\'),
    });
    return response.entry!;
  }

  async function pathExists(fullPath: string): Promise<boolean> {
    try {
      await getByPath(fullPath);
      return true;
    } catch (e: any) {
      if (e.status === 404) return false;
      throw e;
    }
  }

  test('all-new path, autoCreate=true creates the path and imports into the leaf', async () => {
    const root = await newRoot();

    const result = await importDoc(root.id, 'mkdirp_doc', true, 'A/B/C', true);

    expect(result).not.toBeNull();
    expect(result.id!).toBeGreaterThan(0);
    expect(await pathExists(`${root.name}/A`)).toBe(true);
    expect(await pathExists(`${root.name}/A/B`)).toBe(true);
    const leaf = await getByPath(`${root.name}/A/B/C`);
    expect(result.parentId).toBe(leaf.id);
  });

  test('missing path, no flag returns 404 and creates nothing', async () => {
    const root = await newRoot();

    let threw = false;
    let status: number | undefined;
    try {
      await importDoc(root.id, 'noflag_doc', true, 'X/Y', false);
    } catch (e: any) {
      threw = true;
      status = e.status;
    }
    expect(threw).toBe(true);
    expect(status).toBe(404);
    expect(await pathExists(`${root.name}/X`)).toBe(false);
  });

  test('existing path, no flag imports into the leaf', async () => {
    const root = await newRoot();
    const existingA = await makeFolder(root.id, 'A');
    const existingB = await makeFolder(existingA.id, 'B');

    // Flag off, but the whole path already exists → import succeeds into the leaf.
    const result = await importDoc(root.id, 'existing_doc', true, 'A/B', false);

    expect(result).not.toBeNull();
    expect(result.parentId).toBe(existingB.id);
  });

  test('no folderPath is backwards compatible (imported directly into the anchor)', async () => {
    const root = await newRoot();

    const result = await importDoc(root.id, 'compat_doc', true, undefined, undefined);

    expect(result).not.toBeNull();
    expect(result.parentId).toBe(root.id);
  });
});
