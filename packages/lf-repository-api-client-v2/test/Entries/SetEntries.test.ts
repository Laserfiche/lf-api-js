// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import {
  Entry,
  FieldToUpdate,
  FieldType,
  SetFieldsRequest,
  SetTagsRequest,
  SetTemplateRequest,
  StartDeleteEntryRequest,
} from '../../index.js';
import { allFalse, CreateEntry } from '../BaseTest.js';
import { _RepositoryApiClient } from '../CreateSession.js';

describe('Set Entries Integration Tests', () => {
  var entry: Entry;

  afterEach(async () => {
    if (entry) {
      let request = new StartDeleteEntryRequest();
      let entryId = entry.id!;
      await _RepositoryApiClient.entriesClient.startDeleteEntry({ repositoryId, entryId, request });
    }
  });

  test('Set fields', async () => {
    let field = null;
    let fieldValue = 'a';
    let fieldDefinitionsResponse = await _RepositoryApiClient.fieldDefinitionsClient.listFieldDefinitions({ repositoryId });
    let fieldDefinitions = fieldDefinitionsResponse.value;
    
    expect(fieldDefinitions).not.toBeNull();
    fieldDefinitions = fieldDefinitions!;
    
    for (let i = 0; i < fieldDefinitions.length; i++) {
      if (
        fieldDefinitions[i].fieldType == FieldType.String &&
        (fieldDefinitions[i].constraint == '' || fieldDefinitions[i].constraint == null) &&
        (fieldDefinitions[i].length ?? -1 >= 1)
      ) {
        field = fieldDefinitions[i];
        break;
      }
    }

    expect(field).not.toBeNull();
    field = field!;

    let fieldToUpdate = new FieldToUpdate();
    fieldToUpdate.values = [fieldValue];
    fieldToUpdate.name = field.name!
    
    let request = new SetFieldsRequest();
    request.fields = [fieldToUpdate]

    entry = await CreateEntry(_RepositoryApiClient, 'RepositoryApiClientIntegrationTest JS SetFields');
    
    let entryId = entry.id!;
    let response = await _RepositoryApiClient.entriesClient.setFields({
      repositoryId,
      entryId,
      request,
    });
    let fields = response.value;

    expect(fields).not.toBeNull();
    expect(fields!.length).toBe(1);
    expect(fields![0].name!).toBe(field.name);
  });

  test('Set Tags', async (ctx) => {
    let tagDefinitionsResponse = await _RepositoryApiClient.tagDefinitionsClient.listTagDefinitions({ repositoryId });
    let tagDefinitions = tagDefinitionsResponse.value!;

    expect(tagDefinitions).not.toBeNull();
    expect(tagDefinitions.length).toBeGreaterThan(0);

    // Pick an informational tag (isSecure=false). Filter out the "Automatically select tags"
    // pseudo-tag — it has isSecure=false but isn't applicable to entries, so assigning it
    // silently no-ops server-side. Security tags require the caller's trustee to hold the
    // specific tag, which the test service principal typically doesn't.
    let informationalTag = tagDefinitions.find(t => t.isSecure === false && !t.name?.includes('Automatically select tags'));
    if (!informationalTag) {
      ctx.skip();
      return;
    }
    let tag = informationalTag.name!;
    let request = new SetTagsRequest();
    request.tags = [tag];
    entry = await CreateEntry(_RepositoryApiClient, 'RepositoryApiClientIntegrationTest JS SetTags');

    let entryId = entry.id!;
    let setResponse = await _RepositoryApiClient.entriesClient.setTags({ repositoryId, entryId, request });
    let setTags = setResponse.value!;

    // Independently verify the tag was actually applied by listing the entry's tags. This
    // guards against the PUT response being empty even when the tag was set, and gives a
    // clearer failure mode if the SP cannot apply the tag despite it being informational.
    let listResponse = await _RepositoryApiClient.entriesClient.listTags({ repositoryId, entryId });
    let listedTags = listResponse.value!;

    expect(listedTags).not.toBeNull();
    expect(listedTags.length).toBe(1);
    expect(listedTags[0]?.name).toBe(tag);

    // Then assert on the setTags PUT response itself. If listedTags above is correct but
    // these fail, the tag was applied but the PUT response is wrong.
    expect(setTags).not.toBeNull();
    expect(setTags.length).toBe(1);
    expect(setTags[0]?.name).toBe(tag);
  });

  test('Set Templates', async () => {
    // Find a template definition with no required fields
    let template = null;
    let templateDefinitionResponse = await _RepositoryApiClient.templateDefinitionsClient.listTemplateDefinitions({
      repositoryId,
    });
    let templateDefinitions = templateDefinitionResponse.value!;

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

    entry = await CreateEntry(_RepositoryApiClient, 'RepositoryApiClientIntegrationTest JS DeleteTemplate');

    let setTemplateResponse = await _RepositoryApiClient.entriesClient.setTemplate({
      repositoryId,
      entryId: entry.id!,
      request,
    });

    expect(setTemplateResponse).not.toBeNull();
    expect(setTemplateResponse.templateName).toBe(template?.name);
  });
});
