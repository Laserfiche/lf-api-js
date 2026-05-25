// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  CreateFieldDefinitionRequest,
  FieldType,
  ReplaceListValuesRequest,
  UpdateFieldDefinitionRequest,
} from '../../index.js';

function uniqueName(prefix: string): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 17);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${stamp}_${rand}`;
}

describe('Field Definition Admin Integration Tests', () => {
  test('Create / Update / Delete string-field lifecycle', async () => {
    const fieldName = uniqueName('client_test_field');
    let createdId = 0;
    try {
      const created = await _RepositoryApiClient.fieldDefinitionsClient.createFieldDefinition({
        repositoryId,
        request: new CreateFieldDefinitionRequest({
          name: fieldName,
          fieldType: FieldType.String,
          length: 50,
          description: 'Created from JS client integration test',
          isIndexed: true,
          warnIfBlank: true,
        }),
      });

      expect(created).not.toBeNull();
      expect(created.id ?? 0).toBeGreaterThan(0);
      expect(created.name).toBe(fieldName);
      expect(created.fieldType).toBe(FieldType.String);
      expect(created.isIndexed).toBe(true);
      expect(created.warnIfBlank).toBe(true);
      createdId = created.id!;

      const updated = await _RepositoryApiClient.fieldDefinitionsClient.updateFieldDefinition({
        repositoryId,
        fieldId: createdId,
        request: new UpdateFieldDefinitionRequest({
          description: 'Updated description',
          isRequired: true,
        }),
      });

      expect(updated.description).toBe('Updated description');
      expect(updated.isRequired).toBe(true);
      expect(updated.name).toBe(fieldName); // not in PATCH — preserved
      expect(updated.isIndexed).toBe(true); // not in PATCH — preserved
    } finally {
      if (createdId > 0) {
        await _RepositoryApiClient.fieldDefinitionsClient.deleteFieldDefinition({
          repositoryId,
          fieldId: createdId,
        });
      }
    }
  });

  test('List field — replace list values round-trip', async () => {
    const fieldName = uniqueName('client_test_list_field');
    let createdId = 0;
    try {
      const initial = ['Alpha', 'Beta', 'Gamma'];
      const created = await _RepositoryApiClient.fieldDefinitionsClient.createFieldDefinition({
        repositoryId,
        request: new CreateFieldDefinitionRequest({
          name: fieldName,
          fieldType: FieldType.List,
          listValues: initial,
        }),
      });
      createdId = created.id!;

      const listed = await _RepositoryApiClient.fieldDefinitionsClient.getFieldListValues({
        repositoryId,
        fieldId: createdId,
      });
      expect(listed.values).toEqual(initial);

      const replacement = ['One', 'Two', 'Three', 'Four'];
      const afterReplace = await _RepositoryApiClient.fieldDefinitionsClient.replaceFieldListValues({
        repositoryId,
        fieldId: createdId,
        request: new ReplaceListValuesRequest({ values: replacement }),
      });
      expect(afterReplace.values).toEqual(replacement);

      // Independent GET — proves the PUT persisted; same-request reads can mask a missing Save() (Trap 4).
      const afterReplaceReread = await _RepositoryApiClient.fieldDefinitionsClient.getFieldListValues({
        repositoryId,
        fieldId: createdId,
      });
      expect(afterReplaceReread.values).toEqual(replacement);

      const afterClear = await _RepositoryApiClient.fieldDefinitionsClient.replaceFieldListValues({
        repositoryId,
        fieldId: createdId,
        request: new ReplaceListValuesRequest({ values: [] }),
      });
      expect(afterClear.values?.length ?? -1).toBe(0);

      const afterClearReread = await _RepositoryApiClient.fieldDefinitionsClient.getFieldListValues({
        repositoryId,
        fieldId: createdId,
      });
      expect(afterClearReread.values?.length ?? -1).toBe(0);
    } finally {
      if (createdId > 0) {
        await _RepositoryApiClient.fieldDefinitionsClient.deleteFieldDefinition({
          repositoryId,
          fieldId: createdId,
        });
      }
    }
  });

  test('GetContainingTemplates — field not in any template returns empty', async () => {
    const fieldName = uniqueName('client_test_orphan_field');
    let createdId = 0;
    try {
      const created = await _RepositoryApiClient.fieldDefinitionsClient.createFieldDefinition({
        repositoryId,
        request: new CreateFieldDefinitionRequest({
          name: fieldName,
          fieldType: FieldType.String,
          length: 10,
        }),
      });
      createdId = created.id!;

      const containing = await _RepositoryApiClient.fieldDefinitionsClient.getFieldContainingTemplates({
        repositoryId,
        fieldId: createdId,
      });

      expect(containing).not.toBeNull();
      expect(containing.length).toBe(0);
    } finally {
      if (createdId > 0) {
        await _RepositoryApiClient.fieldDefinitionsClient.deleteFieldDefinition({
          repositoryId,
          fieldId: createdId,
        });
      }
    }
  });

  test('GetAssignedEntryCount — brand-new field returns zero', async () => {
    const fieldName = uniqueName('client_test_unassigned_field');
    let createdId = 0;
    try {
      const created = await _RepositoryApiClient.fieldDefinitionsClient.createFieldDefinition({
        repositoryId,
        request: new CreateFieldDefinitionRequest({
          name: fieldName,
          fieldType: FieldType.String,
          length: 10,
        }),
      });
      createdId = created.id!;

      const count = await _RepositoryApiClient.fieldDefinitionsClient.getFieldAssignedEntryCount({
        repositoryId,
        fieldId: createdId,
      });

      expect(count).not.toBeNull();
      expect(count.count).toBe(0);
    } finally {
      if (createdId > 0) {
        await _RepositoryApiClient.fieldDefinitionsClient.deleteFieldDefinition({
          repositoryId,
          fieldId: createdId,
        });
      }
    }
  });
});
