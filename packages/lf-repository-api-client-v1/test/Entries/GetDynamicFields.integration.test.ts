// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { GetDynamicFieldLogicValueRequest, ODataValueContextOfIListOfWTemplateInfo } from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Dynamic Fields Integration Tests', () => {
  const entryId: number = 1;
  test('Get Dynamic Fields Entry', async () => {
    const templateDefinitionResponse: ODataValueContextOfIListOfWTemplateInfo =
      await _RepositoryApiClient.templateDefinitionsClient.getTemplateDefinitions({ repoId: repositoryId });
    const templateDefinitions = templateDefinitionResponse.value;
    if (!templateDefinitions) {
      throw new Error('templateDefinitions is undefined');
    }
    expect(templateDefinitions).not.toBeNull();
    expect(templateDefinitions?.length).toBeGreaterThan(0);
    const request = new GetDynamicFieldLogicValueRequest();
    request.templateId = templateDefinitions[0].id;
    const dynamicFieldValueResponse = await _RepositoryApiClient.entriesClient.getDynamicFieldValues({
      repoId: repositoryId,
      entryId,
      request,
    });
    expect(dynamicFieldValueResponse).not.toBeNull();
  });
});
