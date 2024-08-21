// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import {
  LinkDefinitionCollectionResponse,

} from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Link Definitions Integration Tests', () => {
  test('Get Link Definition', async () => {
    let linkDefinitionsResponse: LinkDefinitionCollectionResponse =
      await _RepositoryApiClient.linkDefinitionsClient.listLinkDefinitions({ repositoryId });
    if (!linkDefinitionsResponse.value) {
      throw new Error('linkDefinitionsResponse.value');
    }
    let firstLinkDefinition = linkDefinitionsResponse.value[0];
    
    expect(firstLinkDefinition).not.toBeNull();
  });


  test('Get Link Definitions for each paging', async () => {
    let maxPageSize = 10;
    let entries = 0;
    let pages = 0;
    const callback = async (response: LinkDefinitionCollectionResponse) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      entries += response.value.length;
      pages += 1;
      return true;
    };
    
    await _RepositoryApiClient.linkDefinitionsClient.listLinkDefinitionsForEach({
      callback,
      repositoryId,
      maxPageSize,
    });
    
    expect(entries).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });


  test('Get Link Definitions Simple Paging', async () => {
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    
    let response = await _RepositoryApiClient.linkDefinitionsClient.listLinkDefinitions({ repositoryId, prefer });
    
    if (!response.value) {
      throw new Error('response.value is undefined');
    }
    
    expect(response).not.toBeNull();
    
    let nextLink = response.odataNextLink ?? '';
    
    expect(nextLink).not.toBeNull();
    expect(response.value.length).toBeLessThanOrEqual(maxPageSize);
    
    let response2 = await _RepositoryApiClient.linkDefinitionsClient.listLinkDefinitionsNextLink({
      nextLink,
      maxPageSize,
    });
    
    if (!response2.value) {
      throw new Error('response.value is undefined');
    }
    
    expect(response2).not.toBeNull();
    expect(response2.value.length).toBeLessThanOrEqual(maxPageSize);
  });
});
