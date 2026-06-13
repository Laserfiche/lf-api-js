// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId, _RepositoryApiClient } from '../CreateSession.js';
import {
  AccessControlType,
  CreateFieldDefinitionRequest,
  FieldAccessControlEntry,
  FieldRight,
  FieldType,
  SetFieldAccessControlRequest,
  TrusteeIdentity,
} from '../../index.js';

// Parallel (JS) coverage for the V2 field access-rights endpoints (PRD 6.4.B — REQ-ACCESS-002):
// getFieldAccessControl, setFieldAccessControl, getFieldRights (effective and aclOnly) and the default-field ACL.
// The dotnet REST integration suite owns the exhaustive contract; these exercise the JS client
// end-to-end against a running server. No multipart upload, so they run under node and jsdom.
//
// Each per-field test creates its OWN throwaway field definition (deleted in afterEach) and borrows
// a real trustee SID at runtime — no hard-coded SIDs, never mutates a shared fixture.
describe('Field Access Rights (REQ-ACCESS-002)', () => {
  let createdFieldId: number | undefined;

  afterEach(async () => {
    if (createdFieldId !== undefined) {
      const fieldId = createdFieldId;
      createdFieldId = undefined;
      try {
        await _RepositoryApiClient.fieldDefinitionsClient.deleteFieldDefinition({ repositoryId, fieldId });
      } catch {
        /* field may already be gone */
      }
    }
  });

  async function createField(): Promise<number> {
    const created = await _RepositoryApiClient.fieldDefinitionsClient.createFieldDefinition({
      repositoryId,
      request: new CreateFieldDefinitionRequest({ name: `JS_ACL_TEST_FIELD_${Date.now()}`, fieldType: FieldType.String }),
    });
    createdFieldId = created.id!;
    return createdFieldId;
  }

  // A real, resolvable trustee SID: prefer one off the field's own ACL (the default ACL copied at
  // creation); fall back to the root entry's ACL.
  async function getAnyTrustee(fieldId: number): Promise<TrusteeIdentity> {
    const acl = await _RepositoryApiClient.fieldDefinitionsClient.getFieldAccessControl({ repositoryId, fieldId });
    const t = acl.entries?.map((e) => e.trustee).find((x) => !!x?.sid);
    if (t) return t;
    const entryAcl = await _RepositoryApiClient.entriesClient.getEntryAccessControl({ repositoryId, entryId: 1 });
    const et = entryAcl.entries?.map((e) => e.trustee).find((x) => !!x?.sid);
    expect(et).toBeDefined();
    return new TrusteeIdentity({ sid: et!.sid, accountName: et!.accountName });
  }

  test('getFieldAccessControl returns an ACL with only explicit (never inherited) ACEs', async () => {
    const fieldId = await createField();
    const acl = await _RepositoryApiClient.fieldDefinitionsClient.getFieldAccessControl({ repositoryId, fieldId });
    expect(acl).not.toBeNull();
    expect(acl.entries).toBeDefined();
    for (const ace of acl.entries!) {
      expect(ace.isInherited).toBeFalsy();
    }
  });

  test('getFieldRights for the calling session includes ReadValue', async () => {
    const fieldId = await createField();
    const rights = await _RepositoryApiClient.fieldDefinitionsClient.getFieldRights({ repositoryId, fieldId });
    expect(rights.rights).toBeDefined();
    expect(rights.rights).toContain(FieldRight.ReadValue);
  });

  test('getFieldRights resolves for a specific trustee by SID', async () => {
    const fieldId = await createField();
    const trustee = await getAnyTrustee(fieldId);
    const rights = await _RepositoryApiClient.fieldDefinitionsClient.getFieldRights({
      repositoryId,
      fieldId,
      trusteeId: trustee.sid,
    });
    expect(rights).not.toBeNull();
    expect(rights.rights).toBeDefined();
  });

  test('getFieldRights with aclOnly for the calling session includes ReadValue', async () => {
    const fieldId = await createField();
    const rights = await _RepositoryApiClient.fieldDefinitionsClient.getFieldRights({ repositoryId, fieldId, aclOnly: true });
    expect(rights.rights).toBeDefined();
    expect(rights.rights).toContain(FieldRight.ReadValue);
  });

  test('getFieldRights with aclOnly resolves for a specific trustee by SID', async () => {
    const fieldId = await createField();
    const trustee = await getAnyTrustee(fieldId);
    const rights = await _RepositoryApiClient.fieldDefinitionsClient.getFieldRights({
      repositoryId,
      fieldId,
      trusteeId: trustee.sid,
      aclOnly: true,
    });
    expect(rights).not.toBeNull();
    expect(rights.rights).toBeDefined();
  });

  test('setFieldAccessControl full replace persists on an independent re-fetch', async () => {
    const fieldId = await createField();
    const trustee = await getAnyTrustee(fieldId);
    await _RepositoryApiClient.fieldDefinitionsClient.setFieldAccessControl({
      repositoryId,
      fieldId,
      request: new SetFieldAccessControlRequest({
        entries: [
          new FieldAccessControlEntry({
            trustee: new TrusteeIdentity({ sid: trustee.sid }),
            accessControlType: AccessControlType.Allow,
            rights: [FieldRight.ReadValue, FieldRight.SetValue],
          }),
        ],
      }),
    });

    const refreshed = await _RepositoryApiClient.fieldDefinitionsClient.getFieldAccessControl({ repositoryId, fieldId });
    const explicit = refreshed.entries!.find(
      (e) => e.trustee?.sid === trustee.sid && e.accessControlType === AccessControlType.Allow
    );
    expect(explicit).toBeDefined();
    expect(explicit!.rights).toContain(FieldRight.ReadValue);
    expect(explicit!.rights).toContain(FieldRight.SetValue);
  });

  test('getDefaultFieldAccessControl returns the repository default field ACL', async () => {
    const acl = await _RepositoryApiClient.fieldDefinitionsClient.getDefaultFieldAccessControl({ repositoryId });
    expect(acl).not.toBeNull();
    expect(acl.entries).toBeDefined();
  });
});
