// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  AddTemplateFieldRequest,
  CreateTemplateRequest,
  LFColor,
  MoveTemplateFieldRequest,
  TemplateFieldAssignment,
  UpdateTemplateFieldPropertiesRequest,
  UpdateTemplatePropertiesRequest,
  UpdateTemplateRequest,
} from '../../index.js';

function uniqueName(prefix: string): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 17);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${stamp}_${rand}`;
}

async function pickExistingFieldNames(count: number): Promise<string[]> {
  const fields = await _RepositoryApiClient.fieldDefinitionsClient.listFieldDefinitions({ repositoryId });
  const names = (fields.value ?? [])
    .map(f => f.name ?? '')
    .filter(n => n.length > 0)
    .slice(0, count);
  if (names.length < count) {
    throw new Error(`Need at least ${count} existing field definition(s) in dev-CA; found ${names.length}.`);
  }
  return names;
}

async function safeDeleteTemplate(templateId: number): Promise<void> {
  if (templateId <= 0) return;
  try {
    await _RepositoryApiClient.templateDefinitionsClient.deleteTemplate({ repositoryId, templateId });
  } catch {
    // Swallow cleanup errors so an earlier assertion isn't masked.
  }
}

describe('Template Definition Admin Integration Tests', () => {
  test('Create / Update / Delete template lifecycle', async () => {
    const templateName = uniqueName('client_test_tmpl');
    let createdId = 0;
    try {
      const created = await _RepositoryApiClient.templateDefinitionsClient.createTemplate({
        repositoryId,
        request: new CreateTemplateRequest({
          name: templateName,
          description: 'Created from JS client integration test',
          isAutoAssignable: false,
          color: new LFColor({ a: 255, r: 100, g: 50, b: 25 }),
        }),
      });

      expect(created).not.toBeNull();
      expect((created.id ?? 0) > 0).toBe(true);
      expect(created.name).toBe(templateName);
      expect(created.isAutoAssignable).toBe(false);
      expect(created.color).not.toBeUndefined();
      expect(created.color?.r).toBe(100);
      createdId = created.id!;

      const renamed = uniqueName('client_test_tmpl_renamed');
      const updated = await _RepositoryApiClient.templateDefinitionsClient.updateTemplate({
        repositoryId,
        templateId: createdId,
        request: new UpdateTemplateRequest({ name: renamed, isAutoAssignable: true }),
      });
      expect(updated.name).toBe(renamed);
      expect(updated.isAutoAssignable).toBe(true);

      const readBack = await _RepositoryApiClient.templateDefinitionsClient.getTemplateDefinition({
        repositoryId,
        templateId: createdId,
      });
      expect(readBack.name).toBe(renamed);
      expect(readBack.isAutoAssignable).toBe(true);

      const deletedId = createdId;
      await _RepositoryApiClient.templateDefinitionsClient.deleteTemplate({ repositoryId, templateId: createdId });
      createdId = 0;

      // 404 after delete — verify the just-deleted template is actually gone.
      // Mirrors the dotnet client's CreateUpdateDelete_Template_Lifecycle assertion
      // added in response to Codex round-2 dotnet review.
      try {
        await _RepositoryApiClient.templateDefinitionsClient.getTemplateDefinition({
          repositoryId,
          templateId: deletedId,
        });
        throw new Error('Should have thrown 404 after delete');
      } catch (e: any) {
        expect(e.status).toBe(404);
      }
    } finally {
      await safeDeleteTemplate(createdId);
    }
  });

  test('UpdateTemplate ClearColor sets color to null', async () => {
    const templateName = uniqueName('client_test_tmpl');
    let createdId = 0;
    try {
      const created = await _RepositoryApiClient.templateDefinitionsClient.createTemplate({
        repositoryId,
        request: new CreateTemplateRequest({
          name: templateName,
          color: new LFColor({ a: 255, r: 30, g: 60, b: 90 }),
        }),
      });
      createdId = created.id!;
      expect(created.color).not.toBeUndefined();

      await _RepositoryApiClient.templateDefinitionsClient.updateTemplate({
        repositoryId,
        templateId: createdId,
        request: new UpdateTemplateRequest({ clearColor: true }),
      });

      const readBack = await _RepositoryApiClient.templateDefinitionsClient.getTemplateDefinition({
        repositoryId,
        templateId: createdId,
      });
      expect(readBack.color).toBeUndefined();
    } finally {
      await safeDeleteTemplate(createdId);
    }
  });

  test('Add / Move / Remove fields lifecycle', async () => {
    const fieldNames = await pickExistingFieldNames(3);
    const templateName = uniqueName('client_test_tmpl');
    let createdId = 0;
    try {
      const created = await _RepositoryApiClient.templateDefinitionsClient.createTemplate({
        repositoryId,
        request: new CreateTemplateRequest({ name: templateName }),
      });
      createdId = created.id!;
      expect(created.fieldCount).toBe(0);

      for (const name of fieldNames) {
        await _RepositoryApiClient.templateDefinitionsClient.addTemplateField({
          repositoryId,
          templateId: createdId,
          request: new AddTemplateFieldRequest({ fieldName: name }),
        });
      }

      const afterAdd = await _RepositoryApiClient.templateDefinitionsClient.listTemplateFieldDefinitionsByTemplateId({
        repositoryId,
        templateId: createdId,
      });
      expect(afterAdd.value?.length).toBe(3);
      expect((afterAdd.value ?? []).map(f => f.name)).toEqual(fieldNames);

      await _RepositoryApiClient.templateDefinitionsClient.moveTemplateField({
        repositoryId,
        templateId: createdId,
        request: new MoveTemplateFieldRequest({ fieldName: fieldNames[0], newPosition: 3 }),
      });

      const afterMove = await _RepositoryApiClient.templateDefinitionsClient.listTemplateFieldDefinitionsByTemplateId({
        repositoryId,
        templateId: createdId,
      });
      expect(afterMove.value?.[2].name).toBe(fieldNames[0]);

      await _RepositoryApiClient.templateDefinitionsClient.removeTemplateField({
        repositoryId,
        templateId: createdId,
        fieldName: fieldNames[1],
      });

      const afterRemove = await _RepositoryApiClient.templateDefinitionsClient.listTemplateFieldDefinitionsByTemplateId({
        repositoryId,
        templateId: createdId,
      });
      expect(afterRemove.value?.length).toBe(2);
      expect((afterRemove.value ?? []).some(f => f.name === fieldNames[1])).toBe(false);
    } finally {
      await safeDeleteTemplate(createdId);
    }
  });

  test('UpdateTemplateFieldProperties IsRequired round-trip', async () => {
    // LocalDescription branch intentionally omitted — RA SetFieldLocalDescription
    // requires LFS ≥ 12.0.2; dev-CA runs older. Server unit tests cover that path.
    const fieldNames = await pickExistingFieldNames(1);
    const templateName = uniqueName('client_test_tmpl');
    let createdId = 0;
    try {
      const created = await _RepositoryApiClient.templateDefinitionsClient.createTemplate({
        repositoryId,
        request: new CreateTemplateRequest({
          name: templateName,
          fields: [new TemplateFieldAssignment({ fieldName: fieldNames[0], isRequired: false })],
        }),
      });
      createdId = created.id!;

      const before = await _RepositoryApiClient.templateDefinitionsClient.listTemplateFieldDefinitionsByTemplateId({
        repositoryId,
        templateId: createdId,
      });
      expect(before.value?.[0].isRequired).toBe(false);

      await _RepositoryApiClient.templateDefinitionsClient.updateTemplateFieldProperties({
        repositoryId,
        templateId: createdId,
        fieldName: fieldNames[0],
        request: new UpdateTemplateFieldPropertiesRequest({ isRequired: true }),
      });

      const after = await _RepositoryApiClient.templateDefinitionsClient.listTemplateFieldDefinitionsByTemplateId({
        repositoryId,
        templateId: createdId,
      });
      expect(after.value?.[0].isRequired).toBe(true);
    } finally {
      await safeDeleteTemplate(createdId);
    }
  });

  // LocalDescription branch — skipped explicitly so it shows up in CI output as
  // an outstanding test rather than living silently in a comment. RA
  // SetFieldLocalDescription requires LFS ≥ 12.0.2; dev-CA runs older. Server
  // unit tests cover the LocalDescription path; re-enable when dev-CA upgrades.
  test.skip('UpdateTemplateFieldProperties LocalDescription round-trip (requires LFS >= 12.0.2)', async () => {});

  test('Properties round-trip', async () => {
    const templateName = uniqueName('client_test_tmpl');
    let createdId = 0;
    try {
      const created = await _RepositoryApiClient.templateDefinitionsClient.createTemplate({
        repositoryId,
        request: new CreateTemplateRequest({ name: templateName }),
      });
      createdId = created.id!;

      const first = await _RepositoryApiClient.templateDefinitionsClient.updateTemplateProperties({
        repositoryId,
        templateId: createdId,
        request: new UpdateTemplatePropertiesRequest({
          set: { 'test.prop.one': 'value-one', 'test.prop.two': 'value-two' },
        }),
      });
      expect(first.properties?.['test.prop.one']).toBe('value-one');
      expect(first.properties?.['test.prop.two']).toBe('value-two');

      const readBack = await _RepositoryApiClient.templateDefinitionsClient.getTemplateProperties({
        repositoryId,
        templateId: createdId,
      });
      expect(readBack.properties?.['test.prop.one']).toBe('value-one');

      const afterPatch = await _RepositoryApiClient.templateDefinitionsClient.updateTemplateProperties({
        repositoryId,
        templateId: createdId,
        request: new UpdateTemplatePropertiesRequest({
          set: { 'test.prop.two': 'value-two-updated' },
          remove: ['test.prop.one'],
        }),
      });
      expect(afterPatch.properties?.['test.prop.one']).toBeUndefined();
      expect(afterPatch.properties?.['test.prop.two']).toBe('value-two-updated');
    } finally {
      await safeDeleteTemplate(createdId);
    }
  });

  test('GetTemplateAssignedEntryCount returns zero for new template', async () => {
    const templateName = uniqueName('client_test_tmpl');
    let createdId = 0;
    try {
      const created = await _RepositoryApiClient.templateDefinitionsClient.createTemplate({
        repositoryId,
        request: new CreateTemplateRequest({ name: templateName }),
      });
      createdId = created.id!;

      const count = await _RepositoryApiClient.templateDefinitionsClient.getTemplateAssignedEntryCount({
        repositoryId,
        templateId: createdId,
      });
      expect(count.count).toBe(0);
    } finally {
      await safeDeleteTemplate(createdId);
    }
  });
});
