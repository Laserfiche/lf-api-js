// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { testAccessKeyFromJson, testServicePrincipalKey } from '../../testHelpers/unitTestHelpers.js';
import { BeforeFetchResult } from './BeforeFetchResult.js';
import { OAuthClientCredentialsHandler } from './OAuthClientCredentialsHandler.js';
import { AccessKey } from '../OAuth/AccessKey.js';
import 'isomorphic-fetch';
import { accessKey, envServicePrincipalKey } from '../../testHelpers/cloudTestHelpers.js';

/**
 * Cloud Integration Tests
 *
 * @group IntegrationTests/Cloud
 */

describe('OAuthClientCredentialsHandler', () => {
  test('Empty service principal key throws exception', () => {
    expect(
      () => new OAuthClientCredentialsHandler('', {} as AccessKey)
    ).toThrow();
  });

  test('Malformed access key throws exception', () => {
    expect(
      () => new OAuthClientCredentialsHandler('blah', {} as AccessKey)
    ).toThrow();
  });

  test('Correct config returns handler', () => {
    let httpRequestHandler = new OAuthClientCredentialsHandler(
      testServicePrincipalKey,
      testAccessKeyFromJson
    );
    expect(httpRequestHandler).toBeTruthy();
  });

  test('Correct config beforeFetchRequestAsync returns regional domain', async () => {
    let httpRequestHandler = new OAuthClientCredentialsHandler(
      envServicePrincipalKey,
      accessKey
    );
    const url = 'https://laserfiche.com/repository/';
    let request: RequestInit = {
      method: 'GET',
      headers: {},
    };
    let result: BeforeFetchResult =
      await httpRequestHandler.beforeFetchRequestAsync(url, request);
    expect(result?.regionalDomain).toBeTruthy();
  });
});
