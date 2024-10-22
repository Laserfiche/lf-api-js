// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { Entry, PostEntryChildrenRequest, EntryType, WFieldInfo, PostEntryChildrenEntryType } from '../index.js';
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

export async function CreateEntry(
  client: IRepositoryApiClient,
  entryName: string | undefined,
  parentEntryId: number = 1,
  autoRename: boolean = true
): Promise<Entry> {
  var request = new PostEntryChildrenRequest();
  request.entryType = PostEntryChildrenEntryType.Folder;
  request.name = entryName;
  var newEntry = await client.entriesClient.createOrCopyEntry({
    repoId: repositoryId,
    entryId: parentEntryId,
    request,
    autoRename,
  });
  expect(newEntry).not.toBeNull();
  expect(newEntry.parentId).toBe(parentEntryId);
  expect(newEntry.entryType).toBe(EntryType.Folder);
  return newEntry;
}

export async function allFalse(arr: WFieldInfo[]): Promise<boolean> {
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
        throw new Error(`testServicePrincipalKey or OAuthAccessKey is undefined`);
      _RepositoryApiClient = RepositoryApiClient.createFromAccessKey(testServicePrincipalKey, OAuthAccessKey);
    } else if (authorizationType === authType.APIServerUsernamePassword) {
      if (!repositoryId || !username || !password || !baseUrl)
        throw new Error(`RepositoryId, Username, Password, or BaseURL is undefined`);
      _RepositoryApiClient = RepositoryApiClient.createFromUsernamePassword(repositoryId, username, password, baseUrl);
    } else {
      throw new Error('Authorization type is undefined')
    }
    let defaultRequestHeaders: Record<string, string> = { 'X-LF-AppID': 'RepositoryApiClientIntegrationTest JS' };
    if (testHeader) {
      defaultRequestHeaders[testHeader] = 'true';
    }
    _RepositoryApiClient.defaultRequestHeaders = defaultRequestHeaders ?? '';
  }
  return _RepositoryApiClient;
}
