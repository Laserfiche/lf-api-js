// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { AuditReasonCollectionResponse } from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Audit Reasons Integration Test', () => {
  test('Get the Audit Reasons', async () => {
    let result: AuditReasonCollectionResponse = await _RepositoryApiClient.auditReasonsClient.listAuditReasons({ repositoryId: repositoryId });
    
    expect(result).not.toBeNull();
    expect(result.value).not.toBeNull();
  });
});
