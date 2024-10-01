// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import {
  DeleteEntryWithAuditReason,
  Entry,
  PutTemplateRequest,
} from '../../index.js';
import { allFalse, CreateEntry } from '../BaseTest.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Remove Entries Integration Tests', () => {
  let entry: Entry;
  afterEach(async () => {
    if (entry) {
      let body = new DeleteEntryWithAuditReason();
      let num = Number(entry.id);
      await _RepositoryApiClient.entriesClient.deleteEntryInfo({
        repoId: repositoryId,
        entryId: num,
        request: body,
      });
    }
  });

  test('Remove Template from Entry Return Entry', async () => {
    // Find a template definition with no required fields
    let template = null;
    let templateDefinitionResponse =
      await _RepositoryApiClient.templateDefinitionsClient.getTemplateDefinitions(
        {
          repoId: repositoryId,
        }
      );
    let templateDefinitions = templateDefinitionResponse.value;
    if (!templateDefinitions) {
      throw new Error('templateDefinitions is undefined');
    }
    expect(templateDefinitions).not.toBeNull();
    expect(templateDefinitions.length).toBeGreaterThan(0);
    for (let i = 0; i < templateDefinitions.length; i++) {
      let templateDefinitionFieldsResponse =
        await _RepositoryApiClient.templateDefinitionsClient.getTemplateFieldDefinitions(
          {
            repoId: repositoryId,
            templateId: templateDefinitions[i].id ?? -1,
          }
        );
      if (
        templateDefinitionFieldsResponse.value &&
        (await allFalse(templateDefinitionFieldsResponse.value))
      ) {
        template = templateDefinitions[i];
        break;
      }
    }
    expect(template).not.toBeNull();

    //Set the template on an entry
    let request = new PutTemplateRequest();
    request.templateName = template?.name;
    entry = await CreateEntry(
      _RepositoryApiClient,
      'RepositoryApiClientIntegrationTest JS RemoveTemplateFromEntry'
    );
    let setTemplateResponse =
      await _RepositoryApiClient.entriesClient.writeTemplateValueToEntry({
        repoId: repositoryId,
        entryId: Number(entry.id),
        request,
      });
    expect(setTemplateResponse).not.toBeNull();
    expect(setTemplateResponse.templateName).toBe(template?.name);

    //Delete the template on the entry
    let DeleteTemplateResponse =
      await _RepositoryApiClient.entriesClient.deleteAssignedTemplate({
        repoId: repositoryId,
        entryId: Number(entry.id),
      });
    let returnedEntry = DeleteTemplateResponse;
    expect(returnedEntry).not.toBeNull();
    expect(returnedEntry.id).toBe(entry.id);
    expect(returnedEntry.templateId).toBe(0);
    expect(
      returnedEntry.templateName == '' || returnedEntry.templateName == null
    ).toBe(true);
  });
});
