// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';
import { Blob as NodeBlob } from 'buffer';
import {
  ApiException,
  DeleteEntryWithAuditReason,
  FileParameter,
  PostEntryWithEdocMetadataRequest,
} from '../../index.js';
import { isBrowser } from '@laserfiche/lf-js-utils/dist/utils/core-utils.js';

describe('Get Entries Integration Tests', () => {
  let entryId: number = 1;
  let rootPath: string | null = '\\';
  let nonExistingPath: string | null = '\\Non Existing Path';

  test('Get Entry Fields', async () => {
    let entryFieldResponse = await _RepositoryApiClient.entriesClient.getFieldValues({ repoId: repositoryId, entryId });
    expect(entryFieldResponse?.value).not.toBeNull();
  });
  test('Get Entry Listing', async () => {
    let result: any = await _RepositoryApiClient.entriesClient.getEntryListing({
      repoId: repositoryId,
      entryId,
    });
    expect(result?.value?.length).toBeGreaterThan(1);
  });

  test('Get Entry Links', async () => {
    let result: any = await _RepositoryApiClient.entriesClient.getLinkValuesFromEntry({ repoId: repositoryId, entryId });
    expect(result?.value).not.toBeNull();
  });

  test('Get Entry Tags', async () => {
    let result: any = await _RepositoryApiClient.entriesClient.getTagsAssignedToEntry({ repoId: repositoryId, entryId });
    expect(result?.value).not.toBeNull();
  });

  test('Get Entry Return Root Folder', async () => {
    let result: any = await _RepositoryApiClient.entriesClient.getEntry({ repoId: repositoryId, entryId });
    expect(result?.value).not.toBeNull();
  });

  test('Get Entry By Full Path Return Root Folder', async () => {
    let result: any = await _RepositoryApiClient.entriesClient.getEntryByPath({
      repoId: repositoryId,
      fullPath: rootPath,
      fallbackToClosestAncestor: false,
    });
    expect(result?.entry.id).toBe(1);
    expect(result?.entry.fullPath).toBe(rootPath);
    expect(result?.entry.entryType).toBe('Folder');
    expect(result?.ancestorEntry).toBeUndefined();
  });

  test('Get Entry By Full Path Return Ancestor Root Folder', async () => {
    let result: any = await _RepositoryApiClient.entriesClient.getEntryByPath({
      repoId: repositoryId,
      fullPath: nonExistingPath,
      fallbackToClosestAncestor: true,
    });
    expect(result?.ancestorEntry.id).toBe(1);
    expect(result?.ancestorEntry.fullPath).toBe(rootPath);
    expect(result?.ancestorEntry.entryType).toBe('Folder');
    expect(result?.entry).toBeUndefined();
  });

  // Imports the document this test needs instead of pointing at a fixed entry id in the shared
  // test repository: the id this used to hard-code was deleted there, and entry ids are never
  // reused, so the test could not recover on its own. Resolves the TODO from
  // https://github.com/Laserfiche/lf-repository-api-client-js/issues/53
  //
  // Skipped under jsdom: a Blob-bearing multipart body fails before reaching the server there,
  // the same vitest+jsdom limitation already documented in ImportDocument.test.ts.
  test.skipIf(isBrowser())('Get Document Content Type Return Content Headers', async () => {
    const blob: any = new NodeBlob(['RepositoryApiClientIntegrationTest JS GetDocumentContentType'], {
      type: 'text/plain',
    });
    const edoc: FileParameter = {
      fileName: 'RepositoryApiClientIntegrationTest JS GetDocumentContentType.txt',
      data: blob,
    };
    const createResult = await _RepositoryApiClient.entriesClient.importDocument({
      repoId: repositoryId,
      parentEntryId: 1,
      fileName: 'RepositoryApiClientIntegrationTest JS GetDocumentContentType',
      autoRename: true,
      request: new PostEntryWithEdocMetadataRequest(),
      electronicDocument: edoc,
    });
    const documentEntryId: number = createResult.operations?.entryCreate?.entryId ?? 0;
    expect(documentEntryId).not.toBe(0);

    try {
      let result: any = await _RepositoryApiClient.entriesClient.getDocumentContentType({
        repoId: repositoryId,
        entryId: documentEntryId,
      });
      expect(result?.status).toBe(200);
      expect(result?.headers['content-type']).toBeDefined();
      expect(result?.headers['content-length']).toBeDefined();
      expect(result?.result).toBeNull();
    } finally {
      try {
        await _RepositoryApiClient.entriesClient.deleteEntryInfo({
          repoId: repositoryId,
          entryId: documentEntryId,
          request: new DeleteEntryWithAuditReason(),
        });
      } catch {
        // Best effort: the document is auto-renamed, so a leftover is harmless clutter.
      }
    }
  });

  test('Get Entry Throw Exception', async () => {
    try {
      await _RepositoryApiClient.entriesClient.getEntryListing({
        repoId: "fakeRepo",
        entryId,
      });
    } catch (e: any) {
      expect(e.problemDetails.title).toBeDefined();
      expect(e.problemDetails.title).toEqual(e.message);
      expect(e.problemDetails.status).toBe(404);
      expect(e.status).toBe(404);
      expect(e.problemDetails.operationId).toBeDefined();
      expect(e.problemDetails.type).toBeDefined();
      expect(e.problemDetails.instance).toBeDefined();
      expect(e.problemDetails.errorSource).toBeDefined();
      expect(e.problemDetails.traceId).toBeDefined();
      expect(e.problemDetails.extensions).toBeUndefined();
    }
  })

  test('Get Document Content Type Throw Exception', async () => {
    try {
      await _RepositoryApiClient.entriesClient.getDocumentContentType({
        repoId: "fakeRepo",
        entryId,
      });
    } catch (e: any) {
      expect(e.problemDetails.title).toBeDefined();
      expect(e.problemDetails.title).toEqual(e.message);
      expect(e.problemDetails.status).toBe(404);
      expect(e.status).toBe(404);
      expect(e.problemDetails.operationId).toBeDefined();
      expect(e.problemDetails.type).toBeUndefined();
      expect(e.problemDetails.instance).toBeUndefined();
      expect(e.problemDetails.errorSource).toBeUndefined();
      expect(e.problemDetails.traceId).toBeUndefined();
      expect(e.problemDetails.additionalProperties).toBeUndefined();
    }
  })
});

