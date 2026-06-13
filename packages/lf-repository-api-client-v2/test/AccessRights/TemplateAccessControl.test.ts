// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId, _RepositoryApiClient } from '../CreateSession.js';
import {
  AccessControlType,
  CreateTemplateRequest,
  SetTemplateAccessControlRequest,
  TemplateAccessControlEntry,
  TemplateRight,
  TrusteeIdentity,
} from '../../index.js';

// Parallel (JS) coverage for the V2 template access-rights endpoints (PRD 6.4.C — REQ-ACCESS-003):
// getTemplateAccessControl, setTemplateAccessControl, getTemplateRights (effective and aclOnly) and the
// default-template ACL. The dotnet REST integration suite owns the exhaustive contract; these
// exercise the JS client end-to-end against a running server. No multipart upload, so they run
// under node and jsdom.
//
// Each per-template test creates its OWN throwaway template definition (deleted in afterEach) and
// borrows a real trustee SID at runtime — never targets a shared fixture template.
describe('Template Access Rights (REQ-ACCESS-003)', () => {
  let createdTemplateId: number | undefined;

  afterEach(async () => {
    if (createdTemplateId !== undefined) {
      const templateId = createdTemplateId;
      createdTemplateId = undefined;
      try {
        await _RepositoryApiClient.templateDefinitionsClient.deleteTemplate({ repositoryId, templateId });
      } catch {
        /* template may already be gone */
      }
    }
  });

  async function createTemplate(): Promise<number> {
    const created = await _RepositoryApiClient.templateDefinitionsClient.createTemplate({
      repositoryId,
      request: new CreateTemplateRequest({ name: `JS_ACL_TEST_TEMPLATE_${Date.now()}` }),
    });
    createdTemplateId = created.id!;
    return createdTemplateId;
  }

  async function getAnyTrustee(templateId: number): Promise<TrusteeIdentity> {
    const acl = await _RepositoryApiClient.templateDefinitionsClient.getTemplateAccessControl({ repositoryId, templateId });
    const t = acl.entries?.map((e) => e.trustee).find((x) => !!x?.sid);
    if (t) return t;
    const entryAcl = await _RepositoryApiClient.entriesClient.getEntryAccessControl({ repositoryId, entryId: 1 });
    const et = entryAcl.entries?.map((e) => e.trustee).find((x) => !!x?.sid);
    expect(et).toBeDefined();
    return new TrusteeIdentity({ sid: et!.sid, accountName: et!.accountName });
  }

  test('getTemplateAccessControl returns an ACL with only explicit (never inherited) ACEs', async () => {
    const templateId = await createTemplate();
    const acl = await _RepositoryApiClient.templateDefinitionsClient.getTemplateAccessControl({ repositoryId, templateId });
    expect(acl).not.toBeNull();
    expect(acl.entries).toBeDefined();
    for (const ace of acl.entries!) {
      expect(ace.isInherited).toBeFalsy();
    }
  });

  test('getTemplateRights for the calling session includes ReadDefinition', async () => {
    const templateId = await createTemplate();
    const rights = await _RepositoryApiClient.templateDefinitionsClient.getTemplateRights({ repositoryId, templateId });
    expect(rights.rights).toBeDefined();
    expect(rights.rights).toContain(TemplateRight.ReadDefinition);
  });

  test('getTemplateRights resolves for a specific trustee by SID', async () => {
    const templateId = await createTemplate();
    const trustee = await getAnyTrustee(templateId);
    const rights = await _RepositoryApiClient.templateDefinitionsClient.getTemplateRights({
      repositoryId,
      templateId,
      trusteeId: trustee.sid,
    });
    expect(rights).not.toBeNull();
    expect(rights.rights).toBeDefined();
  });

  test('getTemplateRights with aclOnly for the calling session includes ReadDefinition', async () => {
    const templateId = await createTemplate();
    const rights = await _RepositoryApiClient.templateDefinitionsClient.getTemplateRights({ repositoryId, templateId, aclOnly: true });
    expect(rights.rights).toBeDefined();
    expect(rights.rights).toContain(TemplateRight.ReadDefinition);
  });

  test('getTemplateRights with aclOnly resolves for a specific trustee by SID', async () => {
    const templateId = await createTemplate();
    const trustee = await getAnyTrustee(templateId);
    const rights = await _RepositoryApiClient.templateDefinitionsClient.getTemplateRights({
      repositoryId,
      templateId,
      trusteeId: trustee.sid,
      aclOnly: true,
    });
    expect(rights).not.toBeNull();
    expect(rights.rights).toBeDefined();
  });

  test('setTemplateAccessControl full replace persists on an independent re-fetch', async () => {
    const templateId = await createTemplate();
    const trustee = await getAnyTrustee(templateId);
    await _RepositoryApiClient.templateDefinitionsClient.setTemplateAccessControl({
      repositoryId,
      templateId,
      request: new SetTemplateAccessControlRequest({
        entries: [
          new TemplateAccessControlEntry({
            trustee: new TrusteeIdentity({ sid: trustee.sid }),
            accessControlType: AccessControlType.Allow,
            rights: [TemplateRight.ReadDefinition, TemplateRight.Modify],
          }),
        ],
      }),
    });

    const refreshed = await _RepositoryApiClient.templateDefinitionsClient.getTemplateAccessControl({ repositoryId, templateId });
    const explicit = refreshed.entries!.find(
      (e) => e.trustee?.sid === trustee.sid && e.accessControlType === AccessControlType.Allow
    );
    expect(explicit).toBeDefined();
    expect(explicit!.rights).toContain(TemplateRight.ReadDefinition);
    expect(explicit!.rights).toContain(TemplateRight.Modify);
  });

  test('getDefaultTemplateAccessControl returns the repository default template ACL', async () => {
    const acl = await _RepositoryApiClient.templateDefinitionsClient.getDefaultTemplateAccessControl({ repositoryId });
    expect(acl).not.toBeNull();
    expect(acl.entries).toBeDefined();
  });
});
