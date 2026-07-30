// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  CreateEntryRequest,
  CreateEntryRequestEntryType,
  Entry,
  EntryType,
  StartDeleteEntryRequest,
} from '../../index.js';
import { getDeleteEntryAuditReasonId } from '../BaseTest.js';

// Integration tests for the recursive folder-path ("mkdir -p") feature on
// POST /Folder/Children / createEntry (#687492): the optional `folderPath` request-body property
// (relative to the route entry) plus the `autoCreateFolderPath` query flag, exercised through the
// JS client. These validate that the JS client serializes the new JSON body property and appends
// the query flag correctly, and that the OData route resolves — the class of routing/serialization
// bug that has historically surfaced first in the JS client. createEntry uses no multipart upload,
// so these run under both node and jsdom.
describe('Create Entry - Folder Path', () => {
  let rootId: number | undefined;

  afterEach(async () => {
    if (rootId) {
      const request = new StartDeleteEntryRequest();
      request.auditReasonId = await getDeleteEntryAuditReasonId(_RepositoryApiClient);
      await _RepositoryApiClient.entriesClient.startDeleteEntry({ repositoryId, entryId: rootId, request });
      rootId = undefined;
    }
  });

  // Each test gets its own uniquely-named root folder directly under the repository root so tests
  // never collide on shared fixture state (folder deletes in LFS are asynchronous). autoRename is
  // off so the name is exact and path lookups are deterministic.
  async function newRoot(): Promise<{ id: number; name: string }> {
    const name = `APIServer_JS_CreateEntryFolderPath_${crypto.randomUUID().replace(/-/g, '')}`;
    const request = new CreateEntryRequest();
    request.entryType = CreateEntryRequestEntryType.Folder;
    request.name = name;
    request.autoRename = false;
    const entry = await _RepositoryApiClient.entriesClient.createEntry({ repositoryId, entryId: 1, request });
    rootId = entry.id!;
    return { id: entry.id!, name };
  }

  async function createFolder(
    entryId: number,
    name: string,
    folderPath: string | undefined,
    autoCreateFolderPath: boolean | undefined,
    autoRename = false
  ): Promise<Entry> {
    const request = new CreateEntryRequest();
    request.entryType = CreateEntryRequestEntryType.Folder;
    request.name = name;
    request.autoRename = autoRename;
    request.folderPath = folderPath;
    return await _RepositoryApiClient.entriesClient.createEntry({ repositoryId, entryId, request, autoCreateFolderPath });
  }

  async function createShortcut(
    entryId: number,
    name: string,
    targetId: number,
    folderPath: string | undefined,
    autoCreateFolderPath: boolean | undefined
  ): Promise<Entry> {
    const request = new CreateEntryRequest();
    request.entryType = CreateEntryRequestEntryType.Shortcut;
    request.name = name;
    request.targetId = targetId;
    request.folderPath = folderPath;
    return await _RepositoryApiClient.entriesClient.createEntry({ repositoryId, entryId, request, autoCreateFolderPath });
  }

  async function makeFolder(parentId: number, name: string): Promise<Entry> {
    const request = new CreateEntryRequest();
    request.entryType = CreateEntryRequestEntryType.Folder;
    request.name = name;
    return await _RepositoryApiClient.entriesClient.createEntry({ repositoryId, entryId: parentId, request });
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

  test('folder, all-new path, autoCreate=true creates the path and the leaf', async () => {
    const root = await newRoot();

    const result = await createFolder(root.id, 'Leaf', 'A/B', true);

    expect(result).not.toBeNull();
    expect(await pathExists(`${root.name}/A`)).toBe(true);
    const pathLeaf = await getByPath(`${root.name}/A/B`);
    // The created folder sits under the resolved path leaf.
    expect(result.parentId).toBe(pathLeaf.id);
    expect(result.entryType).toBe(EntryType.Folder);
    expect(await pathExists(`${root.name}/A/B/Leaf`)).toBe(true);
  });

  test('folder, missing path, no flag returns 404 and creates nothing', async () => {
    const root = await newRoot();

    let threw = false;
    let status: number | undefined;
    try {
      await createFolder(root.id, 'Leaf', 'X/Y', false);
    } catch (e: any) {
      threw = true;
      status = e.status;
    }
    expect(threw).toBe(true);
    expect(status).toBe(404);
    expect(await pathExists(`${root.name}/X`)).toBe(false);
  });

  test('folder, mixed existing and new, autoCreate reuses existing and creates missing', async () => {
    const root = await newRoot();
    const existingA = await makeFolder(root.id, 'A');

    const result = await createFolder(root.id, 'Leaf', 'A/B', true);

    // A reused (same id), B created.
    expect((await getByPath(`${root.name}/A`)).id).toBe(existingA.id);
    const pathLeaf = await getByPath(`${root.name}/A/B`);
    expect(result.parentId).toBe(pathLeaf.id);
  });

  test('shortcut with folderPath, autoCreate creates the shortcut under the resolved leaf', async () => {
    const root = await newRoot();

    // The shortcut target is the root folder itself; the shortcut lands under an auto-made path.
    const result = await createShortcut(root.id, 'Sc', root.id, 'A/B', true);

    expect(result).not.toBeNull();
    expect(result.entryType).toBe(EntryType.Shortcut);
    const pathLeaf = await getByPath(`${root.name}/A/B`);
    expect(result.parentId).toBe(pathLeaf.id);
    expect(await pathExists(`${root.name}/A/B/Sc`)).toBe(true);
  });

  test('no folderPath is backwards compatible (created directly under the anchor)', async () => {
    const root = await newRoot();

    const result = await createFolder(root.id, 'Leaf', undefined, undefined);

    expect(result).not.toBeNull();
    expect(result.parentId).toBe(root.id);
  });

  test.each(['A/B', 'A\\B'])('forward and backslash separators are equivalent (%s)', async (folderPath) => {
    const root = await newRoot();

    const result = await createFolder(root.id, 'Leaf', folderPath, true);

    const leaf = await getByPath(`${root.name}/A/B`);
    expect(result.parentId).toBe(leaf.id);
  });

  test.each(['A/../B', 'A//B'])('invalid path segment (%s) returns 400', async (folderPath) => {
    const root = await newRoot();

    let threw = false;
    let status: number | undefined;
    try {
      await createFolder(root.id, 'Leaf', folderPath, true);
    } catch (e: any) {
      threw = true;
      status = e.status;
    }
    expect(threw).toBe(true);
    expect(status).toBe(400);
  });
});
