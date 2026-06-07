// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  CreateFieldDefinitionRequest,
  CreateTemplateRequest,
  ExternalTable,
  FieldType,
  FormLogicRule,
  SetFormLogicRulesRequest,
  SortDirection,
  TemplateFieldAssignment,
} from '../../index.js';

// Integration tests for the Dynamic Fields admin endpoints (PRD REQ-ADMIN-008):
// external-table reads (RA-direct) and template form-logic rules (RWS-reuse).
// Self-sufficient: reads the external-table fixture and creates its own throwaway template / field
// to bind a form-logic rule, cleaning up afterward. Skips when the fixture is not registered on
// the target account (mirrors the dotnet suite's Assert.Inconclusive).
//
// External tables are READ-ONLY here: on cloud the LFS hard-denies register/update/unregister
// (LFCR_E_ACCESS_DENIED / 9013), so they are provisioned out-of-band via Process Automation "data
// management" and surfaced read-only. The write client methods are gated out of the cloud build
// (EXTERNAL_TABLE_WRITE) and are absent from this client.
//
// Fixture provisioning: import a CSV (columns City, State, Company, Fname, Lname, Email — e.g.
// RepositoryAccess src/SharedTest/TestFiles/data.csv) into the account's PA "data management" as a
// lookup table named APIServer_DynamicFields_Integration_Tests.

// Lookup table provisioned on the dev account's PA "data management" for these tests
// (City, State, Company, Fname, Lname, Email — same shape as RA TestFiles/data.csv).
const EXTERNAL_TABLE_FIXTURE_NAME = 'APIServer_DynamicFields_Integration_Tests';

function uniqueName(prefix: string): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 17);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${stamp}_${rand}`;
}

async function findExistingExternalTable(): Promise<ExternalTable | undefined> {
  let list;
  try {
    list = await _RepositoryApiClient.dynamicFieldsClient.listExternalTables({ repositoryId });
  } catch (e: any) {
    // Endpoint not deployed on the target account yet (e.g. server change not yet released):
    // treat as "no fixture" so the suite skips instead of erroring (mirrors [SkipIfEndpointMissing]).
    if (e?.status === 404) {
      return undefined;
    }
    throw e;
  }
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
  test('ExternalTable list / get / columns (read-only)', async (ctx) => {
    const existing = await findExistingExternalTable();
    if (!existing) {
      ctx.skip(); // No external data source registered on the dev repository.
      return;
    }

    // List surfaces the fixture with the expected lfe schema.
    expect(existing.id ?? 0).toBeGreaterThan(0);
    expect(existing.laserficheSchema).toBe('lfe');

    // Get by id round-trips the same registration.
    const got = await _RepositoryApiClient.dynamicFieldsClient.getExternalTable({
      repositoryId,
      externalTableId: existing.id!,
    });
    expect(got.id).toBe(existing.id);
    expect(got.laserficheName).toBe(existing.laserficheName);

    // Columns hit the backing external data source and return at least one column.
    const columns = await _RepositoryApiClient.dynamicFieldsClient.listExternalTableColumns({
      repositoryId,
      externalTableId: existing.id!,
    });
    expect(columns).not.toBeNull();
    expect(columns.length).toBeGreaterThan(0);
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
