// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { TagDefinitionCollectionResponse } from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Tag Definitions Integration Tests', () => {
  test('Get Tag Definitions', async () => {
    const TagDefinitionsResponse: TagDefinitionCollectionResponse =
      await _RepositoryApiClient.tagDefinitionsClient.listTagDefinitions({ repositoryId });
    
    expect(TagDefinitionsResponse.value).not.toBeNull();
  });

  test('Get Tag Definitions for each paging', async () => {
    const maxPages = 3;
    const maxPageSize = 10;
    let entries = 0;
    let pages = 0;
    const callback = async (response: TagDefinitionCollectionResponse) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      entries += response.value.length;
      pages += 1;
      return maxPages > pages;
    };
    
    await _RepositoryApiClient.tagDefinitionsClient.listTagDefinitionsForEach({ callback, repositoryId, maxPageSize });
    
    expect(entries).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });

  test('Get Tag Definitions Simple Paging', async () => {
    const maxPageSize = 1;
    const prefer = `maxpagesize=${maxPageSize}`;
    
    const response = await _RepositoryApiClient.tagDefinitionsClient.listTagDefinitions({ repositoryId, prefer });
    
    if (!response.value) {
      throw new Error('response.value is undefined');
    }
    
    expect(response).not.toBeNull();
    
    const nextLink = response.odataNextLink ?? '';
    
    expect(nextLink).not.toBeNull();
    expect(response.value.length).toBeLessThanOrEqual(maxPageSize);
    
    const response2 = await _RepositoryApiClient.tagDefinitionsClient.listTagDefinitionsNextLink({
      nextLink,
      maxPageSize,
    });
    
    if (!response2.value) {
      throw new Error('response.value is undefined');
    }
    
    expect(response2).not.toBeNull();
    expect(response2.value.length).toBeLessThanOrEqual(maxPageSize);
  });
  test('Get Tag Definitions by Id', async () => {
    const allTagDefinitionsResponse: TagDefinitionCollectionResponse =
      await _RepositoryApiClient.tagDefinitionsClient.listTagDefinitions({ repositoryId });
    const TagDefinitionsResponse = allTagDefinitionsResponse.value;
    if (!TagDefinitionsResponse) {
      throw new Error('TagDefinitionsResponse is undefined');
    }
    const firstTagDefinitionsResponse = TagDefinitionsResponse[0];
    
    expect(allTagDefinitionsResponse.value).not.toBeNull();
    
    const tagDefinition = await _RepositoryApiClient.tagDefinitionsClient.getTagDefinition({
      repositoryId,
      tagId: firstTagDefinitionsResponse.id ?? -1,
    });
    
    expect(tagDefinition).not.toBeNull();
    expect(tagDefinition.id).toBe(firstTagDefinitionsResponse.id);
  });
});
