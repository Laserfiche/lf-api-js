// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { ListDynamicFieldValuesRequest, TemplateDefinitionCollectionResponse } from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Dynamic Fields Integration Tests', () => {
  let entryId: number = 1;
  test('Get Dynamic Fields Entry', async () => {
    let templateDefinitionResponse: TemplateDefinitionCollectionResponse =
      await _RepositoryApiClient.templateDefinitionsClient.listTemplateDefinitions({ repositoryId: repositoryId });
    let templateDefinitions = templateDefinitionResponse.value;
    if (!templateDefinitions) {
      throw new Error('templateDefinitions is undefined');
    }
    
    expect(templateDefinitions).not.toBeNull();
    expect(templateDefinitions?.length).toBeGreaterThan(0);
    
    let request = new ListDynamicFieldValuesRequest();
    request.templateId = templateDefinitions[0].id!;
    let dynamicFieldValueResponse = await _RepositoryApiClient.entriesClient.listDynamicFieldValues({
      repositoryId,
      entryId,
      request,
    });
    
    expect(dynamicFieldValueResponse).not.toBeNull();
  });
});
