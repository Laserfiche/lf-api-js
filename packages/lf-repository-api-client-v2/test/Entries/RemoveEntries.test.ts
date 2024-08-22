// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { Entry, SetTemplateRequest, StartDeleteEntryRequest } from '../../index.js';
import { allFalse, CreateEntry } from '../BaseTest.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Remove Entries Integration Tests', () => {
  let entry: Entry;
  afterEach(async () => {
    if (entry) {
      let request = new StartDeleteEntryRequest();
      let entryId = Number(entry.id);
      await _RepositoryApiClient.entriesClient.startDeleteEntry({ repositoryId, entryId, request });
    }
  });

  test('Remove Template from Entry Return Entry', async () => {
    // Find a template definition with no required fields
    let template = null;
    let templateDefinitionResponse = await _RepositoryApiClient.templateDefinitionsClient.listTemplateDefinitions({ repositoryId });
    let templateDefinitions = templateDefinitionResponse.value;
    if (!templateDefinitions) {
      throw new Error('templateDefinitions is undefined');
    }
    
    expect(templateDefinitions).not.toBeNull();
    expect(templateDefinitions.length).toBeGreaterThan(0);
    
    for (let i = 0; i < templateDefinitions.length; i++) {
      let templateDefinitionFieldsResponse =
        await _RepositoryApiClient.templateDefinitionsClient.listTemplateFieldDefinitionsByTemplateId({
          repositoryId,
          templateId: templateDefinitions[i].id ?? -1,
        });
      if (templateDefinitionFieldsResponse.value && (await allFalse(templateDefinitionFieldsResponse.value))) {
        template = templateDefinitions[i];
        break;
      }
    }
    expect(template).not.toBeNull();

    // Set the template on an entry
    let request = new SetTemplateRequest();
    request.templateName = template?.name!;
    entry = await CreateEntry(_RepositoryApiClient, 'RepositoryApiClientIntegrationTest JS RemoveTemplateFromEntry');
    let entryId = entry.id!;
    let setTemplateResponse = await _RepositoryApiClient.entriesClient.setTemplate({
      repositoryId,
      entryId,
      request,
    });
    
    expect(setTemplateResponse).not.toBeNull();
    expect(setTemplateResponse.templateName).toBe(template?.name);

    // Delete the template on the entry
    let DeleteTemplateResponse = await _RepositoryApiClient.entriesClient.removeTemplate({
      repositoryId,
      entryId,
    });
    let returnedEntry = DeleteTemplateResponse;
    
    expect(returnedEntry).not.toBeNull();
    expect(returnedEntry.id).toBe(entry.id);
    expect(returnedEntry.templateId).toBe(0);
    expect(returnedEntry.templateName == '' || returnedEntry.templateName == null).toBe(true);
  });
});
