// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import {
  testAccessKeyFromJson,
  testServicePrincipalKey,
} from '../../testHelpers/unitTestHelpers.js';
import { BeforeFetchResult } from './BeforeFetchResult.js';
import { OAuthClientCustomTokenCredentialsHandler } from './OAuthClientCustomTokenCredentialsHandler.js';
import { AccessKey } from '../OAuth/AccessKey.js';
import 'isomorphic-fetch';
import { GetAccessTokenResponse } from '../OAuth/GetAccessTokenResponse.js';

/**
 * UnitTests Tests
 *
 * @group UnitTests
 */

describe('OAuthClientCredentialsHandler', () => {
  test('Correct config returns handler', () => {
    var accsddToken: GetAccessTokenResponse = {
      access_token: '',
      scope: '',
      refresh_token: '',
      expires_in: Date.now(),
      token_type: '',
    };
    var oauthClientCustomTokenCredentialsHandler =
      new OAuthClientCustomTokenCredentialsHandler(async () => {
        return accsddToken;
      });
    expect(oauthClientCustomTokenCredentialsHandler).toBeDefined();
  });

  test('Incorrect config throws on beforeRequestAsync??', () => {
    var accsddToken: GetAccessTokenResponse = {
      access_token: '',
      scope: '',
      refresh_token: '',
      expires_in: Date.now(),
      token_type: '',
    };
    var oauthClientCustomTokenCredentialsHandler =
      new OAuthClientCustomTokenCredentialsHandler(async () => {
        return accsddToken;
      });
    const url = 'https://laserfiche.com/repository/';
    let request: RequestInit = {
      method: 'GET',
      headers: {},
    };

    expect(oauthClientCustomTokenCredentialsHandler).toBeDefined();
    expect(
      async () =>
        await oauthClientCustomTokenCredentialsHandler.beforeFetchRequestAsync(
          url,
          request
        )
    ).rejects.toThrow();
  });

  test('Correct config beforeFetchRequestAsync returns regional domain', async () => {
    var accsddToken: GetAccessTokenResponse = {
      access_token: '',
      scope: '',
      refresh_token: '',
      expires_in: Date.now(),
      token_type: '',
    };
    var oauthClientCustomTokenCredentialsHandler =
      new OAuthClientCustomTokenCredentialsHandler(async () => {
        return accsddToken;
      });
    const url = 'https://laserfiche.com/repository/';
    let request: RequestInit = {
      method: 'GET',
      headers: {},
    };

    expect(oauthClientCustomTokenCredentialsHandler).toBeDefined();
    var beforeRequestResult: BeforeFetchResult = await oauthClientCustomTokenCredentialsHandler.beforeFetchRequestAsync(
          url,
          request
        );
    expect(beforeRequestResult.regionalDomain).toBe('');
  });
});
