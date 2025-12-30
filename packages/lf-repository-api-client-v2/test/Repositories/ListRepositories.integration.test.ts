// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId, authorizationType, baseUrl } from '../TestHelper.js';
import { RepositoryCollectionResponse, RepositoriesClient } from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import { authorizationTypeEnum } from '../AuthorizationType.js';
import 'isomorphic-fetch';

describe('Repo List Integration Tests', () => {
  test('Get Repo Lists', async () => {
    let response = await _RepositoryApiClient.repositoriesClient.listRepositories({});
    let repositoryFound = false;

    expect(response.value).not.toBeNull();

    let repositories = response.value!;
    
    for (let i = 0; i < repositories.length; i++) {
      expect(repositories[i].id).not.toBeNull();
      expect(repositories[i].name).not.toBeNull();
      expect(repositories[i].webClientUrl).toContain(repositories[i].id);
      
      if (repositories[i].id?.localeCompare(repositoryId, undefined, { sensitivity: "base" }) === 0) {
        repositoryFound = true;
      }
    }

    expect(repositoryFound).toBe(true);
  });

  if (authorizationType == authorizationTypeEnum.APIServerUsernamePassword) {
    test('Get SelfHosted Repo Lists', async () => {
      let response = await RepositoriesClient.listSelfHostedRepositories({ baseUrl });
      let repositoryFound = false;

      expect(response.value).not.toBeNull();

      let repositories = response.value!;
      
      for (let i = 0; i < repositories.length; i++) {
        if (repositories[i].id?.localeCompare(repositoryId, undefined, { sensitivity: "base" }) === 0) {
          repositoryFound = true;
        }
      }

      expect(repositoryFound).toBe(true);
    });
  }
});
