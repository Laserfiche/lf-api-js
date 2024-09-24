// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { SimpleSearchRequest } from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Simple Search Integration Tests', () => {

  test('Create Simple Search', async () => {
    let request: SimpleSearchRequest = new SimpleSearchRequest();
    request.searchCommand = "({LF:Basic ~= \"search text\", option=\"DFANLT\"})";
    let simpleSearchResponse = await _RepositoryApiClient.simpleSearchesClient.createSimpleSearchOperation({
      repoId: repositoryId,
      request,
    });
    expect(simpleSearchResponse.value).not.toBeNull();
  });

});
