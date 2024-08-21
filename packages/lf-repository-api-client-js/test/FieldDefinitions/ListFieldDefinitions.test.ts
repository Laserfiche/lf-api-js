// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { FieldDefinitionCollectionResponse } from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Field Definitions Integration Tests', () => {
  test('Get Field Definitions', async () => {
    let result: FieldDefinitionCollectionResponse =
    
    await _RepositoryApiClient.fieldDefinitionsClient.listFieldDefinitions({ repositoryId });
    
    expect(result.value).not.toBeNull();
  });

  test('Get Field Definitions simple paging', async () => {
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    
    let response = await _RepositoryApiClient.fieldDefinitionsClient.listFieldDefinitions({ repositoryId, prefer });
    
    expect(response).not.toBeNull();
    expect(response.value).not.toBeNull();
    
    let nextLink: string = response.odataNextLink ?? '';
    
    expect(nextLink).not.toBeNull();
    expect(response.value!.length).toBeLessThanOrEqual(maxPageSize);
    
    let response2 = await _RepositoryApiClient.fieldDefinitionsClient.listFieldDefinitionsNextLink({
      nextLink,
      maxPageSize,
    });

    expect(response2).not.toBeNull();
    expect(response2.value).not.toBeNull();
    expect(response2.value!.length).toBeLessThanOrEqual(maxPageSize);
  });

  test('Get Field Definitions for each paging', async () => {
    let maxPages = 3;
    let maxPageSize = 10;
    let entries = 0;
    let pages = 0;
    const callback = async (response: FieldDefinitionCollectionResponse) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      entries += response.value.length;
      pages += 1;
      return maxPages > pages;
    };
    
    await _RepositoryApiClient.fieldDefinitionsClient.listFieldDefinitionsForEach({ callback, repositoryId, maxPageSize });
    
    expect(entries).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });

  test('Get Field Definitions by Id', async () => {
    let FieldDefResponse: FieldDefinitionCollectionResponse =
      await _RepositoryApiClient.fieldDefinitionsClient.listFieldDefinitions({ repositoryId });
    if (!FieldDefResponse.value) {
      throw new Error('FieldDefResponse.value is undefined');
    }
    let fieldDefinition1 = FieldDefResponse.value[0];
    
    expect(fieldDefinition1).not.toBeNull();
    
    let response = await _RepositoryApiClient.fieldDefinitionsClient.getFieldDefinition({
      repositoryId,
      fieldId: fieldDefinition1.id ?? -1,
    });

    expect(response.id).toBe(fieldDefinition1.id);
  });
});
