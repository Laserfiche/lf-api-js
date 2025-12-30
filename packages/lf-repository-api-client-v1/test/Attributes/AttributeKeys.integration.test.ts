// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { ODataValueContextOfListOfAttribute, IRepositoryApiClient } from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Attribute Key Integration Tests', () => {
  test('Get the attribute keys', async () => {
    let result: ODataValueContextOfListOfAttribute =
      await _RepositoryApiClient.attributesClient.getTrusteeAttributeKeyValuePairs({ repoId: repositoryId, everyone: true });
    expect(result).not.toBeNull();
  });

  test('Get the attribute keys simple paging', async () => {
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    let result: ODataValueContextOfListOfAttribute =
      await _RepositoryApiClient.attributesClient.getTrusteeAttributeKeyValuePairs({ repoId: repositoryId, everyone: true, prefer });
    if (!result.value) {
      throw new Error('result.value is undefined');
    }
    expect(result).not.toBeNull();
    expect(result).not.toBeNull();
    let nextLink = result.odataNextLink ?? '';
    expect(nextLink).not.toBeNull();
    expect(result.value.length).toBeLessThanOrEqual(maxPageSize);
    let response2 = await _RepositoryApiClient.attributesClient.getTrusteeAttributeKeyValuePairsNextLink({
      nextLink,
      maxPageSize,
    });
    if (!response2.value) {
      throw new Error('result.value is undefined');
    }
    expect(response2).not.toBeNull();
    expect(response2.value.length).toBeLessThanOrEqual(maxPageSize);
  });

  test('Get Attribute for each paging', async () => {
    let maxPageSize = 10;
    let entries = 0;
    let pages = 0;
    const callback = async (response: ODataValueContextOfListOfAttribute) => {
      entries += response.toJSON().value.length;
      pages += 1;
      return true;
    };
    await _RepositoryApiClient.attributesClient.getTrusteeAttributeKeyValuePairsForEach({
      callback,
      repoId: repositoryId,
      everyone: true,
      maxPageSize,
    });
    expect(entries).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });

  test('Get the attribute value by Key', async () => {
    let result: ODataValueContextOfListOfAttribute =
      await _RepositoryApiClient.attributesClient.getTrusteeAttributeKeyValuePairs({ repoId: repositoryId });
    let attributeKeys = result.value;
    if (!attributeKeys) {
      throw new Error('attributeKeys is undefined');
    }
    expect(attributeKeys).not.toBeNull();
    expect(attributeKeys.length).toBeGreaterThan(0);
    let attributeValueResponse = await _RepositoryApiClient.attributesClient.getTrusteeAttributeValueByKey({
      repoId: repositoryId,
      attributeKey: attributeKeys[0].key ?? '',
    });
    expect(attributeValueResponse).not.toBeNull();
    expect(attributeValueResponse).not.toBe('');
  });
});
