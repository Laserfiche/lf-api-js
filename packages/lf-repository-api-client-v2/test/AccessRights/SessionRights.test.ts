// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId, _RepositoryApiClient } from '../CreateSession.js';

// Parallel (JS) coverage for the V2 getSessionRights endpoint (PRD 6.4.B — REQ-ACCESS-004): the
// current session's effective privileges / feature rights (named-boolean maps) and read-only flag.
// Read-only and side-effect-free; runs under node and jsdom.
describe('Session Rights (REQ-ACCESS-004)', () => {
  test('getSessionRights returns named-boolean privilege and feature-right maps', async () => {
    const rights = await _RepositoryApiClient.repositoriesClient.getSessionRights({ repositoryId });

    expect(rights).not.toBeNull();
    expect(rights.privileges).toBeDefined();
    expect(rights.featureRights).toBeDefined();
    expect(Object.keys(rights.privileges!).length).toBeGreaterThan(0);
    expect(Object.keys(rights.featureRights!).length).toBeGreaterThan(0);
    // The admin session used for tests is read-write and holds at least one privilege.
    expect(rights.isReadOnly).toBe(false);
    expect(Object.values(rights.privileges!).some((v) => v === true)).toBe(true);
  });
});
