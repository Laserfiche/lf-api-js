// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  CreateFieldDefinitionRequest,
  CreateTemplateRequest,
  ExternalTable,
  ExternalTableRequest,
  FieldType,
  FormLogicRule,
  SetFormLogicRulesRequest,
  SortDirection,
  TemplateFieldAssignment,
} from '../../index.js';

// Integration tests for the Dynamic Fields admin endpoints (PRD REQ-ADMIN-008):
// external-table registration (RA-direct) and template form-logic rules (RWS-reuse).
// Self-sufficient: reuses the shared PMT_LoadTest_LT external-table fixture's coordinates and
// creates its own throwaway alias / template / field, cleaning up afterward. Skips when that
// fixture is not registered on the target account (mirrors the dotnet suite's Assert.Inconclusive).
//
// Fixture provisioning (Option 1, manual / account-level — same fixture the RA cloud test
// TemplateTest.FormLogicParentFieldTest uses): import RepositoryAccess
// src/SharedTest/TestFiles/data.csv (columns City, State, Company, Fname, Lname, Email) into the
// account's Process Automation "data management" as a lookup table named PMT_LoadTest_LT.

// Shared cross-suite fixture name (RA TemplateTest.FormLogicParentFieldTest, RWS, API Server).
const EXTERNAL_TABLE_FIXTURE_NAME = 'PMT_LoadTest_LT';

function uniqueName(prefix: string): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 17);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${stamp}_${rand}`;
}

async function findExistingExternalTable(): Promise<ExternalTable | undefined> {
  const list = await _RepositoryApiClient.dynamicFieldsClient.listExternalTables({ repositoryId });
  if (!list || list.length === 0) {
    return undefined;
  }
  // Prefer the shared PMT_LoadTest_LT fixture; fall back to any registration so the suite still
  // exercises the surface on accounts that registered a differently-named table.
  return (
    list.find((t) => (t.laserficheName ?? '').toLowerCase() === EXTERNAL_TABLE_FIXTURE_NAME.toLowerCase()) ?? list[0]
  );
}

describe('Dynamic Fields Admin Integration Tests', () => {
  test('ExternalTable register / list / get / columns / update / unregister lifecycle', async (ctx) => {
    const existing = await findExistingExternalTable();
    if (!existing) {
      ctx.skip(); // No external data source registered on the dev repository.
      return;
    }

    const alias = uniqueName('client_test_exttable');
    let newId = 0;
    try {
      const created = await _RepositoryApiClient.dynamicFieldsClient.registerExternalTable({
        repositoryId,
        request: new ExternalTableRequest({
          laserficheName: alias,
          database: existing.database,
          schema: existing.schema,
          table: existing.table,
        }),
      });
      expect(created).not.toBeNull();
      expect(created.id ?? 0).toBeGreaterThan(0);
      expect(created.laserficheName).toBe(alias);
      expect(created.laserficheSchema).toBe('lfe');
      newId = created.id!;

      const list = await _RepositoryApiClient.dynamicFieldsClient.listExternalTables({ repositoryId });
      expect(list.some((t) => t.id === newId)).toBe(true);

      const got = await _RepositoryApiClient.dynamicFieldsClient.getExternalTable({
        repositoryId,
        externalTableId: newId,
      });
      expect(got.laserficheName).toBe(alias);
      expect(got.table).toBe(existing.table);

      const columns = await _RepositoryApiClient.dynamicFieldsClient.listExternalTableColumns({
        repositoryId,
        externalTableId: newId,
      });
      expect(columns).not.toBeNull();
      expect(columns.length).toBeGreaterThan(0);

      const updated = await _RepositoryApiClient.dynamicFieldsClient.updateExternalTable({
        repositoryId,
        externalTableId: newId,
        request: new ExternalTableRequest({
          laserficheName: alias,
          database: existing.database,
          schema: existing.schema,
          table: existing.table,
        }),
      });
      expect(updated.id).toBe(newId);
    } finally {
      if (newId > 0) {
        try {
          await _RepositoryApiClient.dynamicFieldsClient.unregisterExternalTable({
            repositoryId,
            externalTableId: newId,
          });
        } catch {
          /* best-effort cleanup */
        }
      }
    }
  });

  test('FormLogic set / get / clear lifecycle', async (ctx) => {
    const existing = await findExistingExternalTable();
    if (!existing) {
      ctx.skip(); // No external table to bind a dynamic field to.
      return;
    }
    const columns = await _RepositoryApiClient.dynamicFieldsClient.listExternalTableColumns({
      repositoryId,
      externalTableId: existing.id!,
    });
    if (!columns || columns.length === 0) {
      ctx.skip(); // External table fixture exposes no columns to bind.
      return;
    }
    const boundColumn = columns[0];

    const fieldName = uniqueName('client_test_dynfield');
    const templateName = uniqueName('client_test_dyntmpl');
    let fieldId = 0;
    let templateId = 0;
    try {
      const field = await _RepositoryApiClient.fieldDefinitionsClient.createFieldDefinition({
        repositoryId,
        request: new CreateFieldDefinitionRequest({ name: fieldName, fieldType: FieldType.String, length: 100 }),
      });
      fieldId = field.id!;

      const template = await _RepositoryApiClient.templateDefinitionsClient.createTemplate({
        repositoryId,
        request: new CreateTemplateRequest({
          name: templateName,
          fields: [new TemplateFieldAssignment({ fieldName, isRequired: false })],
        }),
      });
      templateId = template.id!;

      // Set a simple dynamic-field rule binding the field to the external column.
      const setResp = await _RepositoryApiClient.dynamicFieldsClient.setTemplateFormLogicRules({
        repositoryId,
        templateId,
        request: new SetFormLogicRulesRequest({
          rules: [
            new FormLogicRule({
              fieldId,
              boundTableId: existing.id,
              boundColumn,
              sortColumn: boundColumn,
              sortDirection: SortDirection.Ascending,
              validate: false,
            }),
          ],
        }),
      });
      expect(setResp.length).toBe(1);
      expect(setResp[0].fieldId).toBe(fieldId);

      // Independent GET asserts the rule persisted.
      const getResp = await _RepositoryApiClient.dynamicFieldsClient.getTemplateFormLogicRules({
        repositoryId,
        templateId,
      });
      expect(getResp.length).toBe(1);
      expect(getResp[0].fieldId).toBe(fieldId);
      expect(getResp[0].boundColumn).toBe(boundColumn);
      expect(getResp[0].boundTableId).toBe(existing.id);

      // Full-replace with an empty set clears all dynamic fields on the template.
      const clearResp = await _RepositoryApiClient.dynamicFieldsClient.setTemplateFormLogicRules({
        repositoryId,
        templateId,
        request: new SetFormLogicRulesRequest({ rules: [] }),
      });
      expect(clearResp.length).toBe(0);

      const afterClear = await _RepositoryApiClient.dynamicFieldsClient.getTemplateFormLogicRules({
        repositoryId,
        templateId,
      });
      expect(afterClear.length).toBe(0);
    } finally {
      if (templateId > 0) {
        try {
          await _RepositoryApiClient.templateDefinitionsClient.deleteTemplate({ repositoryId, templateId });
        } catch {
          /* best-effort cleanup */
        }
      }
      if (fieldId > 0) {
        try {
          await _RepositoryApiClient.fieldDefinitionsClient.deleteFieldDefinition({ repositoryId, fieldId });
        } catch {
          /* best-effort cleanup */
        }
      }
    }
  });
});
