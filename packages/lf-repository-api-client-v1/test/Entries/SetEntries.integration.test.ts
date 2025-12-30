// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import {
  DeleteEntryWithAuditReason,
  Entry,
  FieldToUpdate,
  PutTagRequest,
  PutTemplateRequest,
  ValueToUpdate,
  WFieldInfo,
  WFieldType,
  WTagInfo,
} from '../../index.js';
import { allFalse, CreateEntry } from '../BaseTest.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Set Entries Integration Tests', () => {
  let entry: Entry;

  afterEach(async () => {
    if (entry) {
      const body = new DeleteEntryWithAuditReason();
      const num = Number(entry.id);
      await _RepositoryApiClient.entriesClient.deleteEntryInfo({
        repoId: repositoryId,
        entryId: num,
        request: body,
      });
    }
  });

  test('Set fields', async () => {
    let field = null;
    const fieldValue = 'a';
    const fieldDefinitionsResponse =
      await _RepositoryApiClient.fieldDefinitionsClient.getFieldDefinitions({
        repoId: repositoryId,
      });
    const fieldDefinitions: WFieldInfo[] | undefined =
      fieldDefinitionsResponse.value;
    if (!fieldDefinitions) {
      throw new Error('fieldDefinitions is undefined');
    }
    expect(fieldDefinitions).not.toBeNull();
    for (let i = 0; i < fieldDefinitions.length; i++) {
      if (
        fieldDefinitions[i].fieldType == WFieldType.String &&
        (fieldDefinitions[i].constraint == '' ||
          fieldDefinitions[i].constraint == null) &&
        (fieldDefinitions[i].length ?? -1 >= 1)
      ) {
        field = fieldDefinitions[i];
        break;
      }
    }
    if (!field?.name) {
      throw new Error('field is undefined');
    }
    expect(field).not.toBeNull();
    const value = new ValueToUpdate();
    value.value = fieldValue;
    value.position = 1;
    const name = new FieldToUpdate();
    name.values = [value];
    const requestBody = { [field.name]: name };
    entry = await CreateEntry(
      _RepositoryApiClient,
      'RepositoryApiClientIntegrationTest JS SetFields'
    );
    const num = Number(entry.id);
    const response = await _RepositoryApiClient.entriesClient.assignFieldValues({
      repoId: repositoryId,
      entryId: num,
      fieldsToUpdate: requestBody,
    });
    const fields = response.value;
    if (!fields) {
      throw new Error('fields is undefined');
    }
    expect(fields).not.toBeNull();
    expect(fields.length).toBe(1);
    expect(fields[0].fieldName).toBe(field.name);
  });

  test('Set Tags', async () => {
    const tagDefinitionsResponse =
      await _RepositoryApiClient.tagDefinitionsClient.getTagDefinitions({
        repoId: repositoryId,
      });
    const tagDefinitions = tagDefinitionsResponse.value;
    if (!tagDefinitions) {
      throw new Error('tagDefinitions is undefined');
    }
    expect(tagDefinitions).not.toBeNull();
    expect(tagDefinitions.length).toBeGreaterThan(0);
    const tag: string | undefined = tagDefinitions[0].name ?? '';
    const request = new PutTagRequest();
    request.tags = new Array(tag);
    entry = await CreateEntry(
      _RepositoryApiClient,
      'RepositoryApiClientIntegrationTest JS SetTags'
    );
    const num = Number(entry.id);
    const response = await _RepositoryApiClient.entriesClient.assignTags({
      repoId: repositoryId,
      entryId: num,
      tagsToAdd: request,
    });
    const tags: WTagInfo[] | undefined = response.value;
    if (!tags) {
      throw new Error('tags is undefined');
    }
    expect(tags).not.toBeNull();
    expect(response?.value?.length).toBe(tags?.length);
    expect(tag).toBe(tags[0].name);
  });

  test('Set Templates', async () => {
    // Find a template definition with no required fields
    let template = null;
    const templateDefinitionResponse =
      await _RepositoryApiClient.templateDefinitionsClient.getTemplateDefinitions(
        {
          repoId: repositoryId,
        }
      );
    const templateDefinitions = templateDefinitionResponse.value;
    if (!templateDefinitions) {
      throw new Error('templateDefinitions is undefined');
    }
    expect(templateDefinitions).not.toBeNull();
    expect(templateDefinitions.length).toBeGreaterThan(0);
    for (let i = 0; i < templateDefinitions.length; i++) {
      const templateDefinitionFieldsResponse =
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
    const request = new PutTemplateRequest();
    request.templateName = template?.name;
    entry = await CreateEntry(
      _RepositoryApiClient,
      'RepositoryApiClientIntegrationTest JS DeleteTemplate'
    );
    const setTemplateResponse =
      await _RepositoryApiClient.entriesClient.writeTemplateValueToEntry({
        repoId: repositoryId,
        entryId: Number(entry.id),
        request,
      });
    expect(setTemplateResponse).not.toBeNull();
    expect(setTemplateResponse.templateName).toBe(template?.name);
  });
});
