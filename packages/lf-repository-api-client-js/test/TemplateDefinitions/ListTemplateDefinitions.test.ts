// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import {
  TemplateFieldDefinitionCollectionResponse,
  TemplateDefinitionCollectionResponse,
} from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Template Definitions Integration Tests', () => {
  test('Get Template Definition', async () => {
    let templateDefinitionResponse: TemplateDefinitionCollectionResponse =
      await _RepositoryApiClient.templateDefinitionsClient.listTemplateDefinitions({ repositoryId });
    if (!templateDefinitionResponse.value) {
      throw new Error('templateDefinitionResponse.value');
    }
    let firstTemplateDefinition = templateDefinitionResponse.value[0];
    
    expect(firstTemplateDefinition).not.toBeNull();
    
    let result: TemplateDefinitionCollectionResponse =
      await _RepositoryApiClient.templateDefinitionsClient.listTemplateDefinitions({
        repositoryId,
        templateName: firstTemplateDefinition.name,
      });
    if (!result.value) {
      throw new Error('result.value is undefined');
    }
    let templateInfo = result.value[0];
    
    expect(result).not.toBeNull();
    expect(result.value.length).toBe(1);
    expect(templateInfo.id).toBe(firstTemplateDefinition.id);
  });
  
  test('Get Template Definition Fields', async () => {
    let templateDefinitionResponse: TemplateDefinitionCollectionResponse =
      await _RepositoryApiClient.templateDefinitionsClient.listTemplateDefinitions({ repositoryId });
    if (!templateDefinitionResponse.value) {
      throw new Error('templateDefinitionResponse.value');
    }
    let firstTemplateDefinition = templateDefinitionResponse.value[0];
    
    expect(firstTemplateDefinition).not.toBeNull();
    
    let result: TemplateFieldDefinitionCollectionResponse =
      await _RepositoryApiClient.templateDefinitionsClient.listTemplateFieldDefinitionsByTemplateId({
        repositoryId,
        templateId: firstTemplateDefinition.id ?? -1,
      });
    
    let templateDefinitions = result.value;
    
    expect(templateDefinitions).not.toBeNull();
    expect(templateDefinitions?.length).toBe(firstTemplateDefinition.fieldCount);
  });

  test('Get Template Definitions for each paging', async () => {
    let maxPages = 3;
    let maxPageSize = 10;
    let entries = 0;
    let pages = 0;
    const callback = async (response: TemplateDefinitionCollectionResponse) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      entries += response.value.length;
      pages += 1;
      return maxPages > pages;
    };
    
    await _RepositoryApiClient.templateDefinitionsClient.listTemplateDefinitionsForEach({
      callback,
      repositoryId,
      maxPageSize,
    });
    
    expect(entries).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });

  test('Get Template Definition Fields Simple Paging', async () => {
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    
    let response = await _RepositoryApiClient.templateDefinitionsClient.listTemplateDefinitions({ repositoryId, prefer });
    if (!response.value) {
      throw new Error('response.value is undefined');
    }
    
    expect(response).not.toBeNull();
    
    let nextLink = response.odataNextLink ?? '';
    
    expect(nextLink).not.toBeNull();
    expect(response.value.length).toBeLessThanOrEqual(maxPageSize);
    
    let response2 = await _RepositoryApiClient.templateDefinitionsClient.listTemplateDefinitionsNextLink({
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
    let templateDefinitionResponse: TemplateDefinitionCollectionResponse =
      await _RepositoryApiClient.templateDefinitionsClient.listTemplateDefinitions({ repositoryId });
    if (!templateDefinitionResponse.value) {
      throw new Error('templateDefinitionResponse.value');
    }
    let firstTemplateDefinition = templateDefinitionResponse.value[0];
    
    expect(firstTemplateDefinition).not.toBeNull();
    
    let result: TemplateFieldDefinitionCollectionResponse =
      await _RepositoryApiClient.templateDefinitionsClient.listTemplateFieldDefinitionsByTemplateName({
        repositoryId,
        templateName: firstTemplateDefinition.name ?? '',
      });
    let templateDefinitions = result.value;
    
    expect(templateDefinitions).not.toBeNull();
    expect(templateDefinitions?.length).toBe(firstTemplateDefinition.fieldCount);
  });

  test('Get Template Field Definition Fields Simple Paging', async () => {
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    
    let response = await _RepositoryApiClient.templateDefinitionsClient.listTemplateDefinitions({ repositoryId, prefer });
    
    if (!response.value) {
      throw new Error('response.value is undefined');
    }
    
    expect(response).not.toBeNull();
    
    let nextLink = response.odataNextLink ?? '';
    
    expect(nextLink).not.toBeNull();
    expect(response.value.length).toBeLessThanOrEqual(maxPageSize);
    
    let response2 = await _RepositoryApiClient.templateDefinitionsClient.listTemplateFieldDefinitionsByTemplateIdNextLink({
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
    let templateDefinitionResponse: TemplateDefinitionCollectionResponse =
      await _RepositoryApiClient.templateDefinitionsClient.listTemplateDefinitions({ repositoryId });
    if (!templateDefinitionResponse.value) {
      throw new Error('templateDefinitionResponse.value');
    }
    let firstTemplateDefinition = templateDefinitionResponse.value[0];
    
    expect(firstTemplateDefinition).not.toBeNull();
    
    let result = await _RepositoryApiClient.templateDefinitionsClient.getTemplateDefinition({
      repositoryId,
      templateId: firstTemplateDefinition.id ?? -1,
    });
    
    expect(result).not.toBeNull();
    expect(result.id).toBe(firstTemplateDefinition.id);
  });

  test('Get Template Field Definition by Template Name Simple Paging', async () => {
    let maxPageSize = 1;
    let prefer = `maxpagesize=${maxPageSize}`;
    
    let response = await _RepositoryApiClient.templateDefinitionsClient.listTemplateDefinitions({ repositoryId, prefer });
    
    if (!response.value) {
      throw new Error('response.value is undefined');
    }
    
    expect(response).not.toBeNull();
    
    let nextLink = response.odataNextLink ?? '';
    
    expect(nextLink).not.toBeNull();
    expect(response.value.length).toBeLessThanOrEqual(maxPageSize);
    
    let response2 =
      await _RepositoryApiClient.templateDefinitionsClient.listTemplateFieldDefinitionsByTemplateNameNextLink({
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
