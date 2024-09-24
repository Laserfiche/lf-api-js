// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { AuditReasons } from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Audit Reasons Integration Test', () => {
  test('Get the Audit Reasons', async () => {
    let result: AuditReasons = await _RepositoryApiClient.auditReasonsClient.getAuditReasons({ repoId: repositoryId });
    expect(result).not.toBeNull();
    expect(result.deleteEntry).not.toBeNull();
    expect(result.exportDocument).not.toBeNull();
  });
});
