// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { accessKey, envServicePrincipalKey } from '../../cloudTestHelpers.js';
import { GetAccessTokenResponse } from './GetAccessTokenResponse.js';
import { TokenClient } from './TokenClient.js';
import 'isomorphic-fetch';

/**
 * Cloud Integration Tests
 *
 * @group IntegrationTests/Cloud
 */

describe('getAccessTokenFromServicePrincipal', () => {
  let inst: TokenClient;
  test('Wrong domain returns null', async () => {
    let domain = 'fake.laserfiche.com';
    inst = new TokenClient(domain);

    expect(
      async () => await inst.getAccessTokenFromServicePrincipal(envServicePrincipalKey, accessKey)
    ).rejects.toThrow();
  });

  test('Malformed domain returns null', async () => {
    let domain = 'blah';
    inst = new TokenClient(domain);

    expect(
      async () => await inst.getAccessTokenFromServicePrincipal(envServicePrincipalKey, accessKey)
    ).rejects.toThrow();
  });

  test('Correct config returns access token', async () => {
    let domain = accessKey.domain;
    inst = new TokenClient(domain);

    let result: GetAccessTokenResponse = await inst.getAccessTokenFromServicePrincipal(
      envServicePrincipalKey,
      accessKey,
    );
    expect(result?.access_token).toBeTruthy();
    expect(result?.scope).toBe(undefined);
  });

  test('Correct config with scope returns scope', async () => {
    let domain = accessKey.domain;
    inst = new TokenClient(domain);

    let result: GetAccessTokenResponse = await inst.getAccessTokenFromServicePrincipal(
      envServicePrincipalKey,
      accessKey,
      "repository.Read"
    );
    expect(result?.access_token).toBeTruthy();
    expect(result?.scope).toBe("repository.Read");
  });

  test('Correct config with incorrect scope is not included', async () => {
    let domain = accessKey.domain;
    inst = new TokenClient(domain);

    let result: GetAccessTokenResponse = await inst.getAccessTokenFromServicePrincipal(
      envServicePrincipalKey,
      accessKey,
      "repository.Read invalidScope"
    );
    expect(result?.access_token).toBeTruthy();
    expect(result?.scope).toBe("repository.Read");
  });

  // test('Correct config with read specific entry scope', async () => {
  //   let domain = accessKey.domain;
  //   inst = new TokenClient(domain);

  //   let result: GetAccessTokenResponse = await inst.getAccessTokenFromServicePrincipal(
  //     testServicePrincipalKey,
  //     accessKey,
  //     "repositories/Repositories/r-12345/Entries/123.ReadWrite"
  //   );
  //   expect(result?.access_token).toBeTruthy();
  //   expect(result?.scope).toBe("repositories/Repositories/r-12345/Entries/123.ReadWrite");
  // });

  test('Correct domain is case insensitive', async () => {
    let domain = accessKey.domain.toUpperCase();
    inst = new TokenClient(domain);

    let result: GetAccessTokenResponse = await inst.getAccessTokenFromServicePrincipal(
      envServicePrincipalKey,
      accessKey
    );
    expect(result?.access_token).toBeTruthy();
  });

  test('Empty domain throws exception', async () => {
    let domain = '';
    expect(() => new TokenClient(domain)).toThrow();
  });
});
