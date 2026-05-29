// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  CreateFieldDefinitionRequest,
  FieldType,
  ReplaceListValuesRequest,
  UpdateFieldDefinitionRequest,
  UpdateFieldPropertiesRequest,
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

  test('Extended properties — create / get / update round-trip', async () => {
    const fieldName = uniqueName('client_test_props_field');
    let createdId = 0;
    try {
      // Create with an initial property set — atomic with the create call.
      const initialProps: { [key: string]: string } = {
        'lf-cli-test-key1': 'alpha',
        'lf-cli-test-key2': 'beta',
      };
      const created = await _RepositoryApiClient.fieldDefinitionsClient.createFieldDefinition({
        repositoryId,
        request: new CreateFieldDefinitionRequest({
          name: fieldName,
          fieldType: FieldType.String,
          length: 25,
          properties: initialProps,
        }),
      });
      createdId = created.id!;

      // GET — bag should include the two keys we set on Create.
      const bag = await _RepositoryApiClient.fieldDefinitionsClient.getFieldProperties({
        repositoryId,
        fieldId: createdId,
      });
      expect(bag.properties?.['lf-cli-test-key1']).toBe('alpha');
      expect(bag.properties?.['lf-cli-test-key2']).toBe('beta');

      // PATCH — set one new key, remove one of the existing keys.
      const afterUpdate = await _RepositoryApiClient.fieldDefinitionsClient.updateFieldProperties({
        repositoryId,
        fieldId: createdId,
        request: new UpdateFieldPropertiesRequest({
          set: { 'lf-cli-test-key3': 'gamma' },
          remove: ['lf-cli-test-key1'],
        }),
      });
      expect(afterUpdate.properties?.['lf-cli-test-key1']).toBeUndefined();
      expect(afterUpdate.properties?.['lf-cli-test-key2']).toBe('beta');
      expect(afterUpdate.properties?.['lf-cli-test-key3']).toBe('gamma');

      // Independent GET — verify the PATCH persisted (defense against same-request masking).
      const afterUpdateReread = await _RepositoryApiClient.fieldDefinitionsClient.getFieldProperties({
        repositoryId,
        fieldId: createdId,
      });
      expect(afterUpdateReread.properties?.['lf-cli-test-key1']).toBeUndefined();
      expect(afterUpdateReread.properties?.['lf-cli-test-key3']).toBe('gamma');
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

  // ---- Coverage tests added during pre-PR review ----

  // Test #1: end-to-end round-trip for every FieldType, mirrors the dotnet integration test.
  // Iterates 8 types (Blob skipped — historically not exercised via the admin API).
  test('All FieldTypes — create / describe / update round-trip', async () => {
    const types = [
      FieldType.String,
      FieldType.List,
      FieldType.Number,
      FieldType.Date,
      FieldType.DateTime,
      FieldType.Time,
      FieldType.ShortInteger,
      FieldType.LongInteger,
    ];

    for (const fieldType of types) {
      const fieldName = uniqueName(`client_test_type_${fieldType}`);
      let createdId = 0;
      try {
        const reqInit: any = {
          name: fieldName,
          fieldType,
          description: `Round-trip test for ${fieldType}`,
        };
        if (fieldType === FieldType.String || fieldType === FieldType.List) {
          reqInit.length = 25;
        }
        if (fieldType === FieldType.List) {
          reqInit.listValues = ['Alpha', 'Beta'];
        }
        const created = await _RepositoryApiClient.fieldDefinitionsClient.createFieldDefinition({
          repositoryId,
          request: new CreateFieldDefinitionRequest(reqInit),
        });
        expect(created.id ?? 0, `${fieldType}: id`).toBeGreaterThan(0);
        expect(created.fieldType, `${fieldType}: round-tripped type`).toBe(fieldType);
        createdId = created.id!;

        // Independent GET — defense against same-request masking (Trap 4).
        const fetched = await _RepositoryApiClient.fieldDefinitionsClient.getFieldDefinition({
          repositoryId,
          fieldId: createdId,
        });
        expect(fetched.fieldType).toBe(fieldType);
        expect(fetched.description).toBe(`Round-trip test for ${fieldType}`);

        // PATCH description; verify regardless of type.
        const updated = await _RepositoryApiClient.fieldDefinitionsClient.updateFieldDefinition({
          repositoryId,
          fieldId: createdId,
          request: new UpdateFieldDefinitionRequest({
            description: `Updated for ${fieldType}`,
          }),
        });
        expect(updated.description, `${fieldType}: PATCH didn't stick`).toBe(`Updated for ${fieldType}`);
      } finally {
        if (createdId > 0) {
          await _RepositoryApiClient.fieldDefinitionsClient.deleteFieldDefinition({
            repositoryId,
            fieldId: createdId,
          });
        }
      }
    }
  });

  // Test #2: GET /Properties on a fresh field with no caller-set properties.
  // Surfaces what LFS-internal keys (if any) come back — closes Codex round-3
  // finding #4 with empirical evidence.
  test('GetFieldProperties — fresh field documents LFS-internal entries', async () => {
    const fieldName = uniqueName('client_test_props_probe');
    let createdId = 0;
    try {
      const created = await _RepositoryApiClient.fieldDefinitionsClient.createFieldDefinition({
        repositoryId,
        request: new CreateFieldDefinitionRequest({
          name: fieldName,
          fieldType: FieldType.String,
          length: 10,
          // no properties supplied
        }),
      });
      createdId = created.id!;

      const bag = await _RepositoryApiClient.fieldDefinitionsClient.getFieldProperties({
        repositoryId,
        fieldId: createdId,
      });
      expect(bag).not.toBeNull();
      expect(bag.properties).not.toBeUndefined();

      // Record entries for triage — visible in vitest output on verbose mode.
      const entries = Object.entries(bag.properties ?? {});
      console.log(`GetFieldProperties on fresh field returned ${entries.length} entries:`);
      for (const [k, v] of entries) {
        console.log(`  [${k}] = [${v}]`);
      }
      for (const [k] of entries) {
        expect(k.length, `LFS returned an empty property key`).toBeGreaterThan(0);
        expect(k.length, `LFS returned an oversized property key: '${k}'`).toBeLessThanOrEqual(256);
      }
    } finally {
      if (createdId > 0) {
        await _RepositoryApiClient.fieldDefinitionsClient.deleteFieldDefinition({
          repositoryId,
          fieldId: createdId,
        });
      }
    }
  });

  // Test #3: server-side 400 validations surface through the JS client as ApiException
  // with parseable problemDetails. Covers a sample of round-1/2/3 validation tightenings.
  test('Validation — round-trips as 400 problemDetails', async () => {
    // length=0 on Create → 400
    await expect(
      _RepositoryApiClient.fieldDefinitionsClient.createFieldDefinition({
        repositoryId,
        request: new CreateFieldDefinitionRequest({
          name: uniqueName('client_test_invalid'),
          fieldType: FieldType.String,
          length: 0,
        }),
      })
    ).rejects.toMatchObject({ status: 400 });

    // listValues on a non-List type → 400
    await expect(
      _RepositoryApiClient.fieldDefinitionsClient.createFieldDefinition({
        repositoryId,
        request: new CreateFieldDefinitionRequest({
          name: uniqueName('client_test_invalid'),
          fieldType: FieldType.String,
          length: 10,
          listValues: ['A', 'B'],
        }),
      })
    ).rejects.toMatchObject({ status: 400 });

    const fieldName = uniqueName('client_test_props_validation');
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

      // PATCH /Properties empty-key → 400
      await expect(
        _RepositoryApiClient.fieldDefinitionsClient.updateFieldProperties({
          repositoryId,
          fieldId: createdId,
          request: new UpdateFieldPropertiesRequest({ set: { '': 'v' } }),
        })
      ).rejects.toMatchObject({ status: 400 });

      // PATCH /Properties same key in set + remove → 400
      await expect(
        _RepositoryApiClient.fieldDefinitionsClient.updateFieldProperties({
          repositoryId,
          fieldId: createdId,
          request: new UpdateFieldPropertiesRequest({
            set: { shared: 'v' },
            remove: ['shared'],
          }),
        })
      ).rejects.toMatchObject({ status: 400 });
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
