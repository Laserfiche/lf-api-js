// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { ODataValueContextOfIListOfWTagInfo, WTagInfo } from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Tag Definitions Integration Tests', () => {
  test('Get Tag Definitions', async () => {
    let TagDefinitionsResponse: ODataValueContextOfIListOfWTagInfo =
      await _RepositoryApiClient.tagDefinitionsClient.getTagDefinitions({ repoId: repositoryId });
    expect(TagDefinitionsResponse.value).not.toBeNull();
  });

  test('Get Tag Definitions for each paging', async () => {
    let maxPageSize = 10;
    let entries = 0;
    let pages = 0;
    const callback = async (response: ODataValueContextOfIListOfWTagInfo) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      entries += response.value.length;
      pages += 1;
      return true;
    };
    await _RepositoryApiClient.tagDefinitionsClient.getTagDefinitionsForEach({ callback, repoId: repositoryId, maxPageSize });
    expect(entries).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });

  test('Get Tag Definitions Simple Paging', async () => {
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    let response = await _RepositoryApiClient.tagDefinitionsClient.getTagDefinitions({ repoId: repositoryId, prefer });
    if (!response.value) {
      throw new Error('response.value is undefined');
    }
    expect(response).not.toBeNull();
    let nextLink = response.odataNextLink ?? '';
    expect(nextLink).not.toBeNull();
    expect(response.value.length).toBeLessThanOrEqual(maxPageSize);
    let response2 = await _RepositoryApiClient.tagDefinitionsClient.getTagDefinitionsNextLink({
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
    let allTagDefinitionsResponse: ODataValueContextOfIListOfWTagInfo =
      await _RepositoryApiClient.tagDefinitionsClient.getTagDefinitions({ repoId: repositoryId });
    let TagDefinitionsResponse = allTagDefinitionsResponse.value;
    if (!TagDefinitionsResponse) {
      throw new Error('TagDefinitionsResponse is undefined');
    }
    let firstTagDefinitionsResponse = TagDefinitionsResponse[0];
    expect(allTagDefinitionsResponse.value).not.toBeNull();
    let tagDefinition: WTagInfo = await _RepositoryApiClient.tagDefinitionsClient.getTagDefinitionById({
      repoId: repositoryId,
      tagId: firstTagDefinitionsResponse.id ?? -1,
    });
    expect(tagDefinition).not.toBeNull();
    expect(tagDefinition.id).toBe(firstTagDefinitionsResponse.id);
  });
});
