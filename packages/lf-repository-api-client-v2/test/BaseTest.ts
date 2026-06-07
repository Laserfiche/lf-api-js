// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import {
  Entry,
  CreateEntryRequest,
  EntryType,
  FieldDefinition,
  CreateEntryRequestEntryType,
  StartDeleteEntryRequest,
  AuditEventType,
} from '../index.js';
import {
  OAuthAccessKey,
  repositoryId,
  testServicePrincipalKey,
  testHeader,
  username,
  password,
  baseUrl,
  authorizationType,
} from './TestHelper.js';
import { IRepositoryApiClient, RepositoryApiClient } from '../index.js';
import { authorizationTypeEnum as authType } from './AuthorizationType.js';
import { isBrowser } from '@laserfiche/lf-js-utils/dist/utils/core-utils.js';

// Shared skip predicate for V2 tests that hit the vitest+jsdom multipart-Blob fetch hang.
// See TFS #658052 — vitest+jsdom regression vs jest+jsdom: a Blob-bearing FormData body sent
// through importEntry (and the rest of the page-manipulation surface) hangs in fetch before
// reaching the server, so every affected test sits at its testTimeout. Passes under
// vitest+node and was passing under jest+jsdom on origin/main. When #658052 closes, drop
// this constant and remove every `describe.skipIf(SKIP_UNDER_JSDOM)` wrapper that gates on
// it (one cleanup pass).
export const SKIP_UNDER_JSDOM = isBrowser();

export async function CreateEntry(
  client: IRepositoryApiClient,
  entryName: string,
  parentEntryId: number = 1,
  autoRename: boolean = true
): Promise<Entry> {
  var request = new CreateEntryRequest();
  request.entryType = CreateEntryRequestEntryType.Folder;
  request.autoRename = autoRename;
  request.name = entryName;
  var newEntry = await client.entriesClient.createEntry({
    repositoryId: repositoryId,
    entryId: parentEntryId,
    request,
  });
  expect(newEntry).not.toBeNull();
  expect(newEntry.parentId).toBe(parentEntryId);
  expect(newEntry.entryType).toBe(EntryType.Folder);
  return newEntry;
}

// Cached per test run; the repository's audit-reason list is static test fixture data.
let _deleteEntryAuditReasonId: number | undefined;
let _deleteEntryAuditReasonResolved = false;

/**
 * Returns the id of a DeleteEntry audit reason, or undefined if the repository has none.
 * The shared test repository's audit policy requires a reason for DeleteEntry — without one
 * the async delete task deterministically reports Failed (400 invalidRequest,
 * "Need to provide correct audit reason for DeleteEntry").
 */
export async function getDeleteEntryAuditReasonId(
  client: IRepositoryApiClient
): Promise<number | undefined> {
  if (!_deleteEntryAuditReasonResolved) {
    const auditReasons = (await client.auditReasonsClient.listAuditReasons({ repositoryId })).value ?? [];
    _deleteEntryAuditReasonId = auditReasons.find((r) => r.auditEventType === AuditEventType.DeleteEntry)?.id;
    _deleteEntryAuditReasonResolved = true;
  }
  return _deleteEntryAuditReasonId;
}

/**
 * Deletes an entry, supplying a valid DeleteEntry audit reason when the repository requires
 * one. Use for test teardown so cleanup entries do not accumulate in the shared repository.
 */
export async function deleteEntry(client: IRepositoryApiClient, entryId: number): Promise<void> {
  const request = new StartDeleteEntryRequest();
  request.auditReasonId = await getDeleteEntryAuditReasonId(client);
  await client.entriesClient.startDeleteEntry({ repositoryId, entryId, request });
}

export async function allFalse(arr: FieldDefinition[]): Promise<boolean> {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].isRequired) {
      return false;
    }
  }
  return true;
}
let _RepositoryApiClient: IRepositoryApiClient;
export function createClient(): IRepositoryApiClient {
  if (!_RepositoryApiClient) {
    if (authorizationType === authType.CloudAccessKey) {
      if (!testServicePrincipalKey || !OAuthAccessKey)
        throw new Error(
          `testServicePrincipalKey or OAuthAccessKey is undefined`
        );
      _RepositoryApiClient = RepositoryApiClient.createFromAccessKey(
        testServicePrincipalKey,
        OAuthAccessKey,
        'repository.ReadWrite',
        baseUrl || undefined
      );
    } else if (authorizationType === authType.APIServerUsernamePassword) {
      if (!repositoryId || !username || !password || !baseUrl)
        throw new Error(
          `RepositoryId, Username, Password, or BaseURL is undefined`
        );
      _RepositoryApiClient = RepositoryApiClient.createFromUsernamePassword(
        repositoryId,
        username,
        password,
        baseUrl
      );
    } else {
      throw new Error('Authorization type is undefined');
    }
    let defaultRequestHeaders: Record<string, string> = {
      'X-LF-AppID': 'RepositoryApiClientIntegrationTest JS',
    };
    if (testHeader) {
      defaultRequestHeaders[testHeader] = 'true';
    }
    _RepositoryApiClient.defaultRequestHeaders = defaultRequestHeaders ?? '';
  }
  return _RepositoryApiClient;
}
