// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  ChangeFieldTypeRequest,
  CreateFieldDefinitionRequest,
  FieldDefinition,
  FieldMergeConflictStrategy,
  FieldType,
  MergeFieldsRequest,
} from '../../index.js';

function uniqueName(prefix: string): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 17);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${stamp}_${rand}`;
}

async function tryDeleteField(fieldId: number): Promise<void> {
  if (fieldId <= 0) return;
  try {
    await _RepositoryApiClient.fieldDefinitionsClient.deleteFieldDefinition({
      repositoryId,
      fieldId,
    });
  } catch (err: any) {
    // Best-effort cleanup. Tolerate cases that don't indicate a defect in the operation under test:
    // the field is already gone (404 — a parallel test or manual repo edit), or a transient dev-CA
    // infrastructure hiccup during teardown — an expired/refused access token (401) or a network blip
    // (`fetch failed`, surfaced as a TypeError with no HTTP status). The test body has already asserted
    // the behavior; a teardown blip must not fail an otherwise-passing test. Genuine delete errors
    // (e.g. 409 still-referenced, 500) still surface.
    const status = err?.status;
    if (status === 404 || status === 401 || status === undefined) {
      if (status !== 404) {
        console.warn(`tryDeleteField(${fieldId}) best-effort cleanup skipped: ${err?.message ?? err}`);
      }
      return;
    }
    throw err;
  }
}

// Reads a field directly to assert that MergeFields preserved it. Any failure (including 404)
// surfaces as a test failure — MergeFields does not consume sources, so the GET must succeed.
async function assertFieldExists(fieldId: number, expectedName: string): Promise<void> {
  const fetched = await _RepositoryApiClient.fieldDefinitionsClient.getFieldDefinition({
    repositoryId,
    fieldId,
  });
  expect(fetched.name).toBe(expectedName);
}

async function createStringField(namePrefix: string, length = 25): Promise<FieldDefinition> {
  return _RepositoryApiClient.fieldDefinitionsClient.createFieldDefinition({
    repositoryId,
    request: new CreateFieldDefinitionRequest({
      name: uniqueName(namePrefix),
      fieldType: FieldType.String,
      length,
    }),
  });
}

describe('Field Merge + ChangeType Integration Tests', () => {
  // ---------------- MergeFields ----------------

  test('MergeFields — two string fields, Fail strategy, happy path', async () => {
    let src1: FieldDefinition | null = null;
    let src2: FieldDefinition | null = null;
    let mergedId = 0;
    try {
      src1 = await createStringField('client_test_merge_src1');
      src2 = await createStringField('client_test_merge_src2');

      const newName = uniqueName('client_test_merge_dest');
      const merged = await _RepositoryApiClient.fieldDefinitionsClient.mergeFields({
        repositoryId,
        request: new MergeFieldsRequest({
          sourceFieldIds: [src1.id!, src2.id!],
          newFieldName: newName,
          onConflict: FieldMergeConflictStrategy.Fail,
        }),
      });

      expect(merged).not.toBeNull();
      expect(merged.id ?? 0).toBeGreaterThan(0);
      expect(merged.name).toBe(newName);
      mergedId = merged.id!;

      // Independent GET — confirms the new field is discoverable post-merge.
      const fetched = await _RepositoryApiClient.fieldDefinitionsClient.getFieldDefinition({
        repositoryId,
        fieldId: mergedId,
      });
      expect(fetched.name).toBe(newName);

      // Source field definitions are preserved by MergeFields — the operation creates a new field,
      // it does not delete the originals. Confirms the documented lifecycle contract.
      await assertFieldExists(src1.id!, src1.name!);
      await assertFieldExists(src2.id!, src2.name!);
    } finally {
      await tryDeleteField(mergedId);
      if (src1) await tryDeleteField(src1.id!);
      if (src2) await tryDeleteField(src2.id!);
    }
  });

  test('MergeFields — MakeMultivalue strategy happy path', async () => {
    let src1: FieldDefinition | null = null;
    let src2: FieldDefinition | null = null;
    let mergedId = 0;
    try {
      src1 = await createStringField('client_test_merge_mv_src1');
      src2 = await createStringField('client_test_merge_mv_src2');

      const merged = await _RepositoryApiClient.fieldDefinitionsClient.mergeFields({
        repositoryId,
        request: new MergeFieldsRequest({
          sourceFieldIds: [src1.id!, src2.id!],
          newFieldName: uniqueName('client_test_merge_mv_dest'),
          onConflict: FieldMergeConflictStrategy.MakeMultivalue,
        }),
      });
      expect(merged.id ?? 0).toBeGreaterThan(0);
      mergedId = merged.id!;

      await assertFieldExists(src1.id!, src1.name!);
      await assertFieldExists(src2.id!, src2.name!);
    } finally {
      await tryDeleteField(mergedId);
      if (src1) await tryDeleteField(src1.id!);
      if (src2) await tryDeleteField(src2.id!);
    }
  });

  test('MergeFields — single source → 400', async () => {
    let src1: FieldDefinition | null = null;
    try {
      src1 = await createStringField('client_test_merge_lone_src');

      await expect(
        _RepositoryApiClient.fieldDefinitionsClient.mergeFields({
          repositoryId,
          request: new MergeFieldsRequest({
            sourceFieldIds: [src1.id!],
            newFieldName: uniqueName('client_test_merge_lone_dest'),
            onConflict: FieldMergeConflictStrategy.Fail,
          }),
        })
      ).rejects.toMatchObject({ status: 400 });
    } finally {
      if (src1) await tryDeleteField(src1.id!);
    }
  });

  test('MergeFields — duplicate sourceFieldIds → 400', async () => {
    let src1: FieldDefinition | null = null;
    try {
      src1 = await createStringField('client_test_merge_dup_src');

      await expect(
        _RepositoryApiClient.fieldDefinitionsClient.mergeFields({
          repositoryId,
          request: new MergeFieldsRequest({
            sourceFieldIds: [src1.id!, src1.id!],
            newFieldName: uniqueName('client_test_merge_dup_dest'),
            onConflict: FieldMergeConflictStrategy.Fail,
          }),
        })
      ).rejects.toMatchObject({ status: 400 });
    } finally {
      if (src1) await tryDeleteField(src1.id!);
    }
  });

  test('MergeFields — UseFirstField without allowDataLoss → 400', async () => {
    let src1: FieldDefinition | null = null;
    let src2: FieldDefinition | null = null;
    try {
      src1 = await createStringField('client_test_merge_uff_src1');
      src2 = await createStringField('client_test_merge_uff_src2');

      await expect(
        _RepositoryApiClient.fieldDefinitionsClient.mergeFields({
          repositoryId,
          request: new MergeFieldsRequest({
            sourceFieldIds: [src1.id!, src2.id!],
            newFieldName: uniqueName('client_test_merge_uff_dest'),
            onConflict: FieldMergeConflictStrategy.UseFirstField,
            allowDataLoss: false,
          }),
        })
      ).rejects.toMatchObject({ status: 400 });
    } finally {
      if (src1) await tryDeleteField(src1.id!);
      if (src2) await tryDeleteField(src2.id!);
    }
  });

  test('MergeFields — UseFirstField with allowDataLoss succeeds', async () => {
    let src1: FieldDefinition | null = null;
    let src2: FieldDefinition | null = null;
    let mergedId = 0;
    try {
      src1 = await createStringField('client_test_merge_uffok_src1');
      src2 = await createStringField('client_test_merge_uffok_src2');

      const merged = await _RepositoryApiClient.fieldDefinitionsClient.mergeFields({
        repositoryId,
        request: new MergeFieldsRequest({
          sourceFieldIds: [src1.id!, src2.id!],
          newFieldName: uniqueName('client_test_merge_uffok_dest'),
          onConflict: FieldMergeConflictStrategy.UseFirstField,
          allowDataLoss: true,
        }),
      });
      expect(merged.id ?? 0).toBeGreaterThan(0);
      mergedId = merged.id!;

      await assertFieldExists(src1.id!, src1.name!);
      await assertFieldExists(src2.id!, src2.name!);
    } finally {
      await tryDeleteField(mergedId);
      if (src1) await tryDeleteField(src1.id!);
      if (src2) await tryDeleteField(src2.id!);
    }
  });

  test('MergeFields — removeFromTemplates pass-through succeeds', async () => {
    // V2 has no template CRUD, so the side effect on templates can't be observed end-to-end here.
    // This exercises the option pass-through: the request deserializes, the controller forwards
    // removeFromTemplates=true to the connector, and the RA call (with no template references to clean
    // up) returns success. Behavioral effect is covered by RepositoryAccess.
    let src1: FieldDefinition | null = null;
    let src2: FieldDefinition | null = null;
    let mergedId = 0;
    try {
      src1 = await createStringField('client_test_merge_rft_src1');
      src2 = await createStringField('client_test_merge_rft_src2');

      const merged = await _RepositoryApiClient.fieldDefinitionsClient.mergeFields({
        repositoryId,
        request: new MergeFieldsRequest({
          sourceFieldIds: [src1.id!, src2.id!],
          newFieldName: uniqueName('client_test_merge_rft_dest'),
          onConflict: FieldMergeConflictStrategy.Fail,
          removeFromTemplates: true,
        }),
      });
      expect(merged.id ?? 0).toBeGreaterThan(0);
      mergedId = merged.id!;

      // The option doesn't affect source-field lifecycle — sources remain even when
      // removeFromTemplates=true (which only affects template references).
      await assertFieldExists(src1.id!, src1.name!);
      await assertFieldExists(src2.id!, src2.name!);
    } finally {
      await tryDeleteField(mergedId);
      if (src1) await tryDeleteField(src1.id!);
      if (src2) await tryDeleteField(src2.id!);
    }
  });

  test('MergeFields — autoRename pass-through succeeds', async () => {
    // Pass-through coverage for the autoRename option: confirms the parameter deserializes and is
    // forwarded through controller → connector → RA without faulting. The visible effect on collision
    // is repository-version-dependent (LFS's merge endpoint does not always honor X-LF-Autorename the
    // way Field.Create does), so this test exercises only the no-collision happy path. Tests that
    // depend on the rename behavior live with RepositoryAccess.
    let src1: FieldDefinition | null = null;
    let src2: FieldDefinition | null = null;
    let mergedId = 0;
    try {
      src1 = await createStringField('client_test_merge_autorename_src1');
      src2 = await createStringField('client_test_merge_autorename_src2');

      const newName = uniqueName('client_test_merge_autorename_dest');
      const merged = await _RepositoryApiClient.fieldDefinitionsClient.mergeFields({
        repositoryId,
        request: new MergeFieldsRequest({
          sourceFieldIds: [src1.id!, src2.id!],
          newFieldName: newName,
          onConflict: FieldMergeConflictStrategy.Fail,
          autoRename: true,
        }),
      });
      expect(merged.id ?? 0).toBeGreaterThan(0);
      mergedId = merged.id!;
      // Without a collision, autoRename has nothing to do — the requested name is honored.
      expect(merged.name).toBe(newName);
    } finally {
      await tryDeleteField(mergedId);
      if (src1) await tryDeleteField(src1.id!);
      if (src2) await tryDeleteField(src2.id!);
    }
  });

  // ---------------- ChangeFieldType ----------------

  test('ChangeFieldType — lossless String → List, happy path', async () => {
    let fld: FieldDefinition | null = null;
    try {
      fld = await createStringField('client_test_change_lossless');

      const changed = await _RepositoryApiClient.fieldDefinitionsClient.changeFieldType({
        repositoryId,
        fieldId: fld.id!,
        request: new ChangeFieldTypeRequest({
          newFieldType: FieldType.List,
          allowDataLoss: false,
        }),
      });
      expect(changed.fieldType).toBe(FieldType.List);

      // Independent GET — confirms ChangeType+Save reached storage.
      const fetched = await _RepositoryApiClient.fieldDefinitionsClient.getFieldDefinition({
        repositoryId,
        fieldId: fld.id!,
      });
      expect(fetched.fieldType).toBe(FieldType.List);
    } finally {
      if (fld) await tryDeleteField(fld.id!);
    }
  });

  test('ChangeFieldType — safe widening ShortInteger → LongInteger succeeds', async () => {
    let fld: FieldDefinition | null = null;
    try {
      fld = await _RepositoryApiClient.fieldDefinitionsClient.createFieldDefinition({
        repositoryId,
        request: new CreateFieldDefinitionRequest({
          name: uniqueName('client_test_change_widen'),
          fieldType: FieldType.ShortInteger,
        }),
      });

      const changed = await _RepositoryApiClient.fieldDefinitionsClient.changeFieldType({
        repositoryId,
        fieldId: fld.id!,
        request: new ChangeFieldTypeRequest({
          newFieldType: FieldType.LongInteger,
          allowDataLoss: false,
        }),
      });
      expect(changed.fieldType).toBe(FieldType.LongInteger);
    } finally {
      if (fld) await tryDeleteField(fld.id!);
    }
  });

  test('ChangeFieldType — leaving List without allowDataLoss → 400', async () => {
    let fld: FieldDefinition | null = null;
    try {
      fld = await _RepositoryApiClient.fieldDefinitionsClient.createFieldDefinition({
        repositoryId,
        request: new CreateFieldDefinitionRequest({
          name: uniqueName('client_test_change_leave_list'),
          fieldType: FieldType.List,
          length: 25,
          listValues: ['Red', 'Blue'],
        }),
      });

      await expect(
        _RepositoryApiClient.fieldDefinitionsClient.changeFieldType({
          repositoryId,
          fieldId: fld.id!,
          request: new ChangeFieldTypeRequest({
            newFieldType: FieldType.String,
            allowDataLoss: false,
          }),
        })
      ).rejects.toMatchObject({ status: 400 });
    } finally {
      if (fld) await tryDeleteField(fld.id!);
    }
  });

  test('ChangeFieldType — leaving List with allowDataLoss succeeds', async () => {
    let fld: FieldDefinition | null = null;
    try {
      fld = await _RepositoryApiClient.fieldDefinitionsClient.createFieldDefinition({
        repositoryId,
        request: new CreateFieldDefinitionRequest({
          name: uniqueName('client_test_change_leave_list_ok'),
          fieldType: FieldType.List,
          length: 25,
          listValues: ['Red', 'Blue'],
        }),
      });

      const changed = await _RepositoryApiClient.fieldDefinitionsClient.changeFieldType({
        repositoryId,
        fieldId: fld.id!,
        request: new ChangeFieldTypeRequest({
          newFieldType: FieldType.String,
          allowDataLoss: true,
        }),
      });
      expect(changed.fieldType).toBe(FieldType.String);

      const fetched = await _RepositoryApiClient.fieldDefinitionsClient.getFieldDefinition({
        repositoryId,
        fieldId: fld.id!,
      });
      expect(fetched.fieldType).toBe(FieldType.String);
    } finally {
      if (fld) await tryDeleteField(fld.id!);
    }
  });

  test('ChangeFieldType — constraint cross-family without allowDataLoss → 400', async () => {
    let fld: FieldDefinition | null = null;
    try {
      fld = await _RepositoryApiClient.fieldDefinitionsClient.createFieldDefinition({
        repositoryId,
        request: new CreateFieldDefinitionRequest({
          name: uniqueName('client_test_change_constraint'),
          fieldType: FieldType.String,
          length: 25,
          constraint: '^[A-Z]+$',
        }),
      });

      await expect(
        _RepositoryApiClient.fieldDefinitionsClient.changeFieldType({
          repositoryId,
          fieldId: fld.id!,
          request: new ChangeFieldTypeRequest({
            newFieldType: FieldType.Number,
            allowDataLoss: false,
          }),
        })
      ).rejects.toMatchObject({ status: 400 });
    } finally {
      if (fld) await tryDeleteField(fld.id!);
    }
  });
});
