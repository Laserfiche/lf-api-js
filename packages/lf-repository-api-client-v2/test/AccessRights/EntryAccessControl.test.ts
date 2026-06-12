// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId, _RepositoryApiClient } from '../CreateSession.js';
import { CreateEntry, deleteEntry } from '../BaseTest.js';
import {
  AccessControlEntry,
  AccessControlType,
  EntryAccessScope,
  EntryRight,
  SetAccessControlRequest,
  TrusteeIdentity,
} from '../../index.js';

// Parallel (JS) coverage for the V2 entry access-rights endpoints (PRD 6.4.A — REQ-ACCESS-001):
// getEntryAccessControl, setEntryAccessControl, getEntryEffectiveRights, getEntryDirectRights
// (REQ-ACCESS-006), and the Trustees lookupTrustees search. The dotnet REST integration suite owns
// the exhaustive contract; these
// exercise the JS client end-to-end against a running server. No multipart upload here, so they
// run under both vitest+node and vitest+jsdom.
//
// Each test creates its OWN folder (autoRename) and derives any trustee SID it needs at runtime
// from the repository's own ACLs — no hard-coded SIDs. afterEach restores an inheriting,
// explicit-ACE-free ACL before deleting, so a Deny-Delete ACE can never leave the folder
// undeletable (the lesson the dotnet suite's shared-folder isolation bug taught us).
describe('Entry Access Rights (REQ-ACCESS-001)', () => {
  let createdEntryId: number | undefined;

  afterEach(async () => {
    if (createdEntryId !== undefined) {
      const entryId = createdEntryId;
      createdEntryId = undefined;
      try {
        await _RepositoryApiClient.entriesClient.setEntryAccessControl({
          repositoryId,
          entryId,
          request: new SetAccessControlRequest({ inheritParents: true, entries: [] }),
        });
      } catch {
        /* folder may already be gone, or caller may lack permission — fall through to delete */
      }
      try {
        await deleteEntry(_RepositoryApiClient, entryId);
      } catch {
        /* leftover is harmless */
      }
    }
  });

  async function createFolder(): Promise<number> {
    const folder = await CreateEntry(_RepositoryApiClient, 'JS AccessRights Test Folder');
    createdEntryId = folder.id!;
    return createdEntryId;
  }

  // Returns a trustee SID present on the entry's ACL (explicit or inherited). Every entry inherits
  // at least the administrative ACEs, so this reliably yields a real, resolvable SID.
  async function getAnyTrustee(entryId: number): Promise<TrusteeIdentity> {
    const acl = await _RepositoryApiClient.entriesClient.getEntryAccessControl({ repositoryId, entryId });
    const trustee = acl.entries?.map((e) => e.trustee).find((t) => !!t?.sid);
    expect(trustee).toBeDefined();
    return trustee!;
  }

  test('getEntryAccessControl returns an ACL whose ACEs carry typed trustees', async () => {
    const entryId = await createFolder();
    const acl = await _RepositoryApiClient.entriesClient.getEntryAccessControl({ repositoryId, entryId });
    expect(acl).not.toBeNull();
    expect(acl.entries).toBeDefined();
    expect(acl.entries!.length).toBeGreaterThan(0);
    for (const ace of acl.entries!) {
      expect(ace.trustee).toBeDefined();
      expect(ace.trustee!.sid).toBeTruthy();
    }
  });

  test('getEntryEffectiveRights for the calling session includes Browse and Read', async () => {
    const entryId = await createFolder();
    const rights = await _RepositoryApiClient.entriesClient.getEntryEffectiveRights({ repositoryId, entryId });
    expect(rights.rights).toBeDefined();
    expect(rights.rights).toContain(EntryRight.Browse);
    expect(rights.rights).toContain(EntryRight.Read);
  });

  test('getEntryEffectiveRights resolves for a specific trustee by SID', async () => {
    const entryId = await createFolder();
    const trustee = await getAnyTrustee(entryId);
    const rights = await _RepositoryApiClient.entriesClient.getEntryEffectiveRights({
      repositoryId,
      entryId,
      trusteeId: trustee.sid,
    });
    expect(rights).not.toBeNull();
    expect(rights.rights).toBeDefined();
  });

  test('getEntryEffectiveRights resolves a trustee addressed by account name', async () => {
    const entryId = await createFolder();
    const trustee = await getAnyTrustee(entryId);
    if (!trustee.accountName) {
      return; // borrowed trustee has no account name to resolve by
    }
    const rights = await _RepositoryApiClient.entriesClient.getEntryEffectiveRights({
      repositoryId,
      entryId,
      trusteeName: trustee.accountName,
    });
    expect(rights).not.toBeNull();
    expect(rights.rights).toBeDefined();
  });

  test('getEntryDirectRights for the calling session includes Browse and Read', async () => {
    const entryId = await createFolder();
    const rights = await _RepositoryApiClient.entriesClient.getEntryDirectRights({ repositoryId, entryId });
    expect(rights.rights).toBeDefined();
    expect(rights.rights).toContain(EntryRight.Browse);
    expect(rights.rights).toContain(EntryRight.Read);
  });

  test('getEntryDirectRights resolves for a specific trustee by SID', async () => {
    const entryId = await createFolder();
    const trustee = await getAnyTrustee(entryId);
    const rights = await _RepositoryApiClient.entriesClient.getEntryDirectRights({
      repositoryId,
      entryId,
      trusteeId: trustee.sid,
    });
    expect(rights).not.toBeNull();
    expect(rights.rights).toBeDefined();
  });

  test('getEntryDirectRights resolves a trustee addressed by account name', async () => {
    const entryId = await createFolder();
    const trustee = await getAnyTrustee(entryId);
    if (!trustee.accountName) {
      return; // borrowed trustee has no account name to resolve by
    }
    const rights = await _RepositoryApiClient.entriesClient.getEntryDirectRights({
      repositoryId,
      entryId,
      trusteeName: trustee.accountName,
    });
    expect(rights).not.toBeNull();
    expect(rights.rights).toBeDefined();
  });

  test('setEntryAccessControl full replace persists on an independent re-fetch', async () => {
    const entryId = await createFolder();
    const trustee = await getAnyTrustee(entryId);
    await _RepositoryApiClient.entriesClient.setEntryAccessControl({
      repositoryId,
      entryId,
      request: new SetAccessControlRequest({
        inheritParents: true,
        entries: [
          new AccessControlEntry({
            trustee: new TrusteeIdentity({ sid: trustee.sid }),
            accessControlType: AccessControlType.Allow,
            rights: [EntryRight.Browse, EntryRight.Read],
            scope: EntryAccessScope.ThisEntry,
          }),
        ],
      }),
    });

    // Trap 4: SetAccessControl stages and is persisted via Save(); never trust the mutating call's
    // own response body — assert via an independent GET.
    const refreshed = await _RepositoryApiClient.entriesClient.getEntryAccessControl({ repositoryId, entryId });
    const explicit = refreshed.entries!.find(
      (e) => !e.isInherited && e.trustee?.sid === trustee.sid && e.accessControlType === AccessControlType.Allow
    );
    expect(explicit).toBeDefined();
    expect(explicit!.rights).toContain(EntryRight.Browse);
    expect(explicit!.rights).toContain(EntryRight.Read);
    expect(refreshed.inheritParents).toBe(true);
  });

  test('setEntryAccessControl with an empty entries list clears explicit ACEs', async () => {
    const entryId = await createFolder();
    const trustee = await getAnyTrustee(entryId);

    // Seed an explicit ACE.
    await _RepositoryApiClient.entriesClient.setEntryAccessControl({
      repositoryId,
      entryId,
      request: new SetAccessControlRequest({
        inheritParents: true,
        entries: [
          new AccessControlEntry({
            trustee: new TrusteeIdentity({ sid: trustee.sid }),
            accessControlType: AccessControlType.Allow,
            rights: [EntryRight.Browse],
            scope: EntryAccessScope.ThisEntry,
          }),
        ],
      }),
    });
    const seeded = await _RepositoryApiClient.entriesClient.getEntryAccessControl({ repositoryId, entryId });
    expect(seeded.entries!.some((e) => !e.isInherited)).toBe(true);

    // An empty entries list with inheritParents=true clears every explicit ACE.
    await _RepositoryApiClient.entriesClient.setEntryAccessControl({
      repositoryId,
      entryId,
      request: new SetAccessControlRequest({ inheritParents: true, entries: [] }),
    });
    const cleared = await _RepositoryApiClient.entriesClient.getEntryAccessControl({ repositoryId, entryId });
    expect(cleared.entries!.some((e) => !e.isInherited)).toBe(false);
  });

  test('setEntryAccessControl rejects a blank trustee sid with 400', async () => {
    const entryId = await createFolder();
    await expect(
      _RepositoryApiClient.entriesClient.setEntryAccessControl({
        repositoryId,
        entryId,
        request: new SetAccessControlRequest({
          inheritParents: true,
          entries: [
            new AccessControlEntry({
              trustee: new TrusteeIdentity({ sid: '' }),
              accessControlType: AccessControlType.Allow,
              rights: [EntryRight.Browse],
              scope: EntryAccessScope.ThisEntry,
            }),
          ],
        }),
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  test('lookupTrustees finds a known trustee', async () => {
    const entryId = await createFolder();
    const trustee = await getAnyTrustee(entryId);
    const accountName = trustee.accountName ?? '';
    const searchTerm = accountName.includes('\\')
      ? accountName.substring(accountName.lastIndexOf('\\') + 1)
      : accountName;

    if (!searchTerm) {
      // Fall back to a presence check if the trustee has no searchable account name.
      const any = await _RepositoryApiClient.trusteesClient.lookupTrustees({ repositoryId, search: 'a' });
      expect(any).toBeDefined();
      return;
    }

    const results = await _RepositoryApiClient.trusteesClient.lookupTrustees({ repositoryId, search: searchTerm });
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    const match = results.find((t) => t.sid === trustee.sid);
    expect(match).toBeDefined();
    expect(match!.sid).toBeTruthy();
  });

  test('lookupTrustees rejects an unrecognized type with 400', async () => {
    await expect(
      _RepositoryApiClient.trusteesClient.lookupTrustees({ repositoryId, search: 'a', type: 'bogus' })
    ).rejects.toMatchObject({ status: 400 });
  });
});
