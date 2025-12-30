// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import {
  ODataValueContextOfIListOfTemplateFieldInfo,
  ODataValueContextOfIListOfWTemplateInfo,
  WTemplateInfo,
} from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Template Definitions Integration Tests', () => {
  test('Get Template Definition', async () => {
    let templateDefinitionResponse: ODataValueContextOfIListOfWTemplateInfo =
      await _RepositoryApiClient.templateDefinitionsClient.getTemplateDefinitions({ repoId: repositoryId });
    if (!templateDefinitionResponse.value) {
      throw new Error('templateDefinitionResponse.value');
    }
    let firstTemplateDefinition = templateDefinitionResponse.value[0];
    expect(firstTemplateDefinition).not.toBeNull();
    let result: ODataValueContextOfIListOfWTemplateInfo =
      await _RepositoryApiClient.templateDefinitionsClient.getTemplateDefinitions({
        repoId: repositoryId,
        templateName: firstTemplateDefinition.name,
      });
    if (!result.value) {
      throw new Error('result.value is undefined');
    }
    let templateInfo: WTemplateInfo = result.value[0];
    expect(result).not.toBeNull();
    expect(result.value.length).toBe(1);
    expect(templateInfo.id).toBe(firstTemplateDefinition.id);
  });
  test('Get Template Definition Fields', async () => {
    let templateDefinitionResponse: ODataValueContextOfIListOfWTemplateInfo =
      await _RepositoryApiClient.templateDefinitionsClient.getTemplateDefinitions({ repoId: repositoryId });
    if (!templateDefinitionResponse.value) {
      throw new Error('templateDefinitionResponse.value');
    }
    let firstTemplateDefinition = templateDefinitionResponse.value[0];
    expect(firstTemplateDefinition).not.toBeNull();
    let result: ODataValueContextOfIListOfTemplateFieldInfo =
      await _RepositoryApiClient.templateDefinitionsClient.getTemplateFieldDefinitions({
        repoId: repositoryId,
        templateId: firstTemplateDefinition.id ?? -1,
      });
    let templateDefinitions = result.value;
    expect(templateDefinitions).not.toBeNull();
    expect(templateDefinitions?.length).toBe(firstTemplateDefinition.fieldCount);
  });

  test('Get Template Definitions for each paging', async () => {
    let maxPageSize = 10;
    let entries = 0;
    let pages = 0;
    const callback = async (response: ODataValueContextOfIListOfWTemplateInfo) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      entries += response.value.length;
      pages += 1;
      return true;
    };
    await _RepositoryApiClient.templateDefinitionsClient.getTemplateDefinitionsForEach({
      callback,
      repoId: repositoryId,
      maxPageSize,
    });
    expect(entries).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });

  test('Get Template Definition Fields Simple Paging', async () => {
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    let response = await _RepositoryApiClient.templateDefinitionsClient.getTemplateDefinitions({ repoId: repositoryId, prefer });
    if (!response.value) {
      throw new Error('response.value is undefined');
    }
    expect(response).not.toBeNull();
    let nextLink = response.odataNextLink ?? '';
    expect(nextLink).not.toBeNull();
    expect(response.value.length).toBeLessThanOrEqual(maxPageSize);
    let response2 = await _RepositoryApiClient.templateDefinitionsClient.getTemplateDefinitionsNextLink({
      nextLink,
      maxPageSize,
    });
    if (!response2.value) {
      throw new Error('response.value is undefined');
    }
    expect(response2).not.toBeNull();
    expect(response2.value.length).toBeLessThanOrEqual(maxPageSize);
  });

  test('Get Template Definition Fields by Template Name', async () => {
    let templateDefinitionResponse: ODataValueContextOfIListOfWTemplateInfo =
      await _RepositoryApiClient.templateDefinitionsClient.getTemplateDefinitions({ repoId: repositoryId });
    if (!templateDefinitionResponse.value) {
      throw new Error('templateDefinitionResponse.value');
    }
    let firstTemplateDefinition = templateDefinitionResponse.value[0];
    expect(firstTemplateDefinition).not.toBeNull();
    let result: ODataValueContextOfIListOfTemplateFieldInfo =
      await _RepositoryApiClient.templateDefinitionsClient.getTemplateFieldDefinitionsByTemplateName({
        repoId: repositoryId,
        templateName: firstTemplateDefinition.name ?? '',
      });
    let templateDefinitions = result.value;
    expect(templateDefinitions).not.toBeNull();
    expect(templateDefinitions?.length).toBe(firstTemplateDefinition.fieldCount);
  });

  test('Get Template Field Definition Fields Simple Paging', async () => {
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    let response = await _RepositoryApiClient.templateDefinitionsClient.getTemplateDefinitions({ repoId: repositoryId, prefer });
    if (!response.value) {
      throw new Error('response.value is undefined');
    }
    expect(response).not.toBeNull();
    let nextLink = response.odataNextLink ?? '';
    expect(nextLink).not.toBeNull();
    expect(response.value.length).toBeLessThanOrEqual(maxPageSize);
    let response2 = await _RepositoryApiClient.templateDefinitionsClient.getTemplateFieldDefinitionsNextLink({
      nextLink,
      maxPageSize,
    });
    if (!response2.value) {
      throw new Error('response.value is undefined');
    }
    expect(response2).not.toBeNull();
    expect(response2.value.length).toBeLessThanOrEqual(maxPageSize);
  });

  test('Get Template Definition Fields by Id', async () => {
    let templateDefinitionResponse: ODataValueContextOfIListOfWTemplateInfo =
      await _RepositoryApiClient.templateDefinitionsClient.getTemplateDefinitions({ repoId: repositoryId });
    if (!templateDefinitionResponse.value) {
      throw new Error('templateDefinitionResponse.value');
    }
    let firstTemplateDefinition = templateDefinitionResponse.value[0];
    expect(firstTemplateDefinition).not.toBeNull();
    let result = await _RepositoryApiClient.templateDefinitionsClient.getTemplateDefinitionById({
      repoId: repositoryId,
      templateId: firstTemplateDefinition.id ?? -1,
    });
    expect(result).not.toBeNull();
    expect(result.id).toBe(firstTemplateDefinition.id);
  });

  test('Get Template Field Definition by Template Name Simple Paging', async () => {
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    let response = await _RepositoryApiClient.templateDefinitionsClient.getTemplateDefinitions({ repoId: repositoryId, prefer });
    if (!response.value) {
      throw new Error('response.value is undefined');
    }
    expect(response).not.toBeNull();
    let nextLink = response.odataNextLink ?? '';
    expect(nextLink).not.toBeNull();
    expect(response.value.length).toBeLessThanOrEqual(maxPageSize);
    let response2 =
      await _RepositoryApiClient.templateDefinitionsClient.getTemplateFieldDefinitionsByTemplateNameNextLink({
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
