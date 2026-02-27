// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { ODataValueContextOfIListOfWFieldInfo, WFieldInfo } from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Field Definitions Integration Tests', () => {
  test('Get Field Definitions', async () => {
    const result: ODataValueContextOfIListOfWFieldInfo =
      await _RepositoryApiClient.fieldDefinitionsClient.getFieldDefinitions({ repoId: repositoryId });
    expect(result.value).not.toBeNull();
  });

  test('Get Field Definitions simple paging', async () => {
    const maxPageSize = 1;
    const prefer = `maxpagesize=${maxPageSize}`;
    const response = await _RepositoryApiClient.fieldDefinitionsClient.getFieldDefinitions({ repoId: repositoryId, prefer });
    if (!response.value) {
      throw new Error('response.value is undefined');
    }
    expect(response).not.toBeNull();
    const nextLink: string = response.odataNextLink ?? '';
    expect(nextLink).not.toBeNull();
    expect(response.value.length).toBeLessThanOrEqual(maxPageSize);
    const response2 = await _RepositoryApiClient.fieldDefinitionsClient.getFieldDefinitionsNextLink({
      nextLink,
      maxPageSize,
    });
    if (!response2.value) {
      throw new Error('response2.value is undefined');
    }
    expect(response2).not.toBeNull();
    expect(response2.value.length).toBeLessThanOrEqual(maxPageSize);
  });

  test('Get Field Definitions for each paging', async () => {
    const maxPageSize = 10;
    let entries = 0;
    let pages = 0;
    const callback = async (response: ODataValueContextOfIListOfWFieldInfo) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      entries += response.value.length;
      pages += 1;
      return true;
    };
    await _RepositoryApiClient.fieldDefinitionsClient.getFieldDefinitionsForEach({ callback, repoId: repositoryId, maxPageSize });
    expect(entries).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });

  test('Get Field Definitions by Id', async () => {
    const FieldDefResponse: ODataValueContextOfIListOfWFieldInfo =
      await _RepositoryApiClient.fieldDefinitionsClient.getFieldDefinitions({ repoId: repositoryId });
    if (!FieldDefResponse.value) {
      throw new Error('FieldDefResponse.value is undefined');
    }
    const firstFieldDef: WFieldInfo = FieldDefResponse.value[0];
    if (!firstFieldDef) {
      throw new Error('firstFieldDef is undefined');
    }
    expect(firstFieldDef).not.toBeNull();
    const response = await _RepositoryApiClient.fieldDefinitionsClient.getFieldDefinitionById({
      repoId: repositoryId,
      fieldDefinitionId: firstFieldDef.id ?? -1,
    });
    const fieldDef = response;
    expect(fieldDef.id).toBe(firstFieldDef.id);
  });
});
