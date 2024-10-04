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
      access_token: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhLmNsb3VkZGV2Lmxhc2VyZmljaGUuY29tIiwiaXNzIjoiaHR0cHM6Ly9zaWduaW4uYS5jbG91ZGRldi5sYXNlcmZpY2hlLmNvbS9vYXV0aC9Ub2tlbiIsImV4cCI6MTcyNzg5OTk3MCwibmJmIjoxNzI3ODk1NzY5LCJzdWIiOiJhbGV4YW5kcmlhLmdvbWV6QGxhc2VyZmljaGUuY29tIiwiY2xpZW50X2lkIjoiYjkxUGdHUjJkUXBlWWVMMnM3OTBWWTB3IiwiY3NpZCI6IjEyMzQ1Njc4OSIsInRyaWQiOiIxMDExIiwibmFtZSI6ImFsZXhhbmRyaWEuZ29tZXoiLCJ1dHlwIjoiRnVsbCIsImd0aWQiOiIxMDc1MTUiLCJhY3NzayI6InlVdFVaMlVTbDNqTENVRktZQkczWVlJMTB2c1F4T01HVlBwWWFxUE1UUlNPRDBGT2VRU1VVQkRPRXQ3WG13REMiLCJ0Y2lkIjoiMDlhMTM4YjgtNTdjNi00ZWRiLTk0OTEtMGM0M2ZkYjNhZjNmIiwic2NvcGUiOiJyZXBvc2l0b3J5LlJlYWQgcmVwb3NpdG9yeS5Xcml0ZSIsImFzc2V0cyI6IntcIkxhc2VyZmljaGVBcGlcIjoyMDR9IiwiaWF0IjoxNzI3ODk2MzcwfQ.mgn9gG5wOgdyyS0ea-6thYT30Ei3baCnTuSaNnUNE93c0AUIVzACFr7glStAcVY0HPv8MTjHWvbaEtYdkF93Nw',
      refresh_token: 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwidHlwIjoiSldUIiwiY3R5IjoiSldUIn0..iuuKcxw1RDSPrsvhVbq76w.zdB8EanC3UJEneWY3IVtMBPF0ohQueSnD1owEtXNAJYy1yxRB2yh9pSAhHeoWGQsgaEbl9gVYTHrrHLxDxwp-5f6FOShL-CcOzzATaAg2JEQZbamVgDqTiM0f0jxyMPbe-BJwEStD0F5IstVwpvbgCZ9-GI2dD3TR-tzifbekWyqo1OmF38Sc40F9mIkHh1N5pKTRhxxz12mfygUfnOZOmK7LhfVb1Ej-RDRBnadBfGVxqYTKXxzH7p8wHbjqNgfpfJZL8KUffi-I9BeMxNAdWrcFgr240r0wUPJxHXYZrQDhAWXDhxkYoXD8h46Cv0vDlGmVG_Zdj0FRb5OzMiBZMIT-KqxPW1Xw11robZCYoh7eZ1_GC9ZaN-5u6Xhimg4DZIjyTIx_NTG0KR1CkXefb5MkB3a1-xUJLuVWdHn3agCdnPX3jY2lqC5FMTHVd9-RQCitL1Ypoy_4dBIqBnIkXaKNg_NFO1y39dAQsCaRyhX-85P_jmBbIgCUGvAIKNJao87qesxrLdFcJCz6hstyUOOIymDGI_3iw3BTtR8HgrtaUwxSHmXLcqJcsR8UqPIy7BZ1ioUJ1MqJVenbe61tB-rAm5IbCeiNpzRLcVqkDTxlcfMszuxILOhxZ_Lg4cFej27dM1xvx92M1Q4rJxIqgrvQCklg7wm_8a2Ofp1TP3slAo8sqqphPApGP5oMLG2tLu6e8JhMxPUO6TzLB9N6czY2k2WW3HV1yt9WWg9dRbo96qM5h2dW5Pag-PaOckon9n3xuhVC0szn_GWfIia3ReMYR9j_OIE-xvF8KdqjYbPZiBfh_x4roBfDS0_vZQbNBpmE9y9M3t4KN0uBPaTpLlvBDL1e_05kXbMzc1jnKgYKyxikvz9pckeBRibfdfhef_IhwY0hV6QvLyglF66_6nW2oz5yFF3-IC48X_wLFl5eurKbCaF5MEUPWpsT-owIG5etd5g-X9TSj1Lllzm3qiYgLO17DdmS85gEEUrvrFOftKGkQkCBF7-F4PS-_hcJYSoVsf9GjBu1-mGHV2VL9dVGE4ROwqoAV4eNt-w3XHCL_7-VeXlRY6MjtxQU0IlakQRiMCndq5bgiYfwr97VSoUGxW9b7E8d6LJYxQiXqUVKqTr9iEZlk02VuLsUr_Pk4j_uEE8ZlmominQ2VcFnQ.brHD3vgcU9X03LwyDQi72w',
      scope: 'repository.Read repository.Write',
      expires_in: Date.now(),
      token_type: 'client_credentials',
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
      access_token: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhLmNsb3VkZGV2Lmxhc2VyZmljaGUuY29tIiwiaXNzIjoiaHR0cHM6Ly9zaWduaW4uYS5jbG91ZGRldi5sYXNlcmZpY2hlLmNvbS9vYXV0aC9Ub2tlbiIsImV4cCI6MTcyNzg5OTk3MCwibmJmIjoxNzI3ODk1NzY5LCJzdWIiOiJhbGV4YW5kcmlhLmdvbWV6QGxhc2VyZmljaGUuY29tIiwiY2xpZW50X2lkIjoiYjkxUGdHUjJkUXBlWWVMMnM3OTBWWTB3IiwiY3NpZCI6IjEyMzQ1Njc4OSIsInRyaWQiOiIxMDExIiwibmFtZSI6ImFsZXhhbmRyaWEuZ29tZXoiLCJ1dHlwIjoiRnVsbCIsImd0aWQiOiIxMDc1MTUiLCJhY3NzayI6InlVdFVaMlVTbDNqTENVRktZQkczWVlJMTB2c1F4T01HVlBwWWFxUE1UUlNPRDBGT2VRU1VVQkRPRXQ3WG13REMiLCJ0Y2lkIjoiMDlhMTM4YjgtNTdjNi00ZWRiLTk0OTEtMGM0M2ZkYjNhZjNmIiwic2NvcGUiOiJyZXBvc2l0b3J5LlJlYWQgcmVwb3NpdG9yeS5Xcml0ZSIsImFzc2V0cyI6IntcIkxhc2VyZmljaGVBcGlcIjoyMDR9IiwiaWF0IjoxNzI3ODk2MzcwfQ.mgn9gG5wOgdyyS0ea-6thYT30Ei3baCnTuSaNnUNE93c0AUIVzACFr7glStAcVY0HPv8MTjHWvbaEtYdkF93Nw',
      refresh_token: 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwidHlwIjoiSldUIiwiY3R5IjoiSldUIn0..iuuKcxw1RDSPrsvhVbq76w.zdB8EanC3UJEneWY3IVtMBPF0ohQueSnD1owEtXNAJYy1yxRB2yh9pSAhHeoWGQsgaEbl9gVYTHrrHLxDxwp-5f6FOShL-CcOzzATaAg2JEQZbamVgDqTiM0f0jxyMPbe-BJwEStD0F5IstVwpvbgCZ9-GI2dD3TR-tzifbekWyqo1OmF38Sc40F9mIkHh1N5pKTRhxxz12mfygUfnOZOmK7LhfVb1Ej-RDRBnadBfGVxqYTKXxzH7p8wHbjqNgfpfJZL8KUffi-I9BeMxNAdWrcFgr240r0wUPJxHXYZrQDhAWXDhxkYoXD8h46Cv0vDlGmVG_Zdj0FRb5OzMiBZMIT-KqxPW1Xw11robZCYoh7eZ1_GC9ZaN-5u6Xhimg4DZIjyTIx_NTG0KR1CkXefb5MkB3a1-xUJLuVWdHn3agCdnPX3jY2lqC5FMTHVd9-RQCitL1Ypoy_4dBIqBnIkXaKNg_NFO1y39dAQsCaRyhX-85P_jmBbIgCUGvAIKNJao87qesxrLdFcJCz6hstyUOOIymDGI_3iw3BTtR8HgrtaUwxSHmXLcqJcsR8UqPIy7BZ1ioUJ1MqJVenbe61tB-rAm5IbCeiNpzRLcVqkDTxlcfMszuxILOhxZ_Lg4cFej27dM1xvx92M1Q4rJxIqgrvQCklg7wm_8a2Ofp1TP3slAo8sqqphPApGP5oMLG2tLu6e8JhMxPUO6TzLB9N6czY2k2WW3HV1yt9WWg9dRbo96qM5h2dW5Pag-PaOckon9n3xuhVC0szn_GWfIia3ReMYR9j_OIE-xvF8KdqjYbPZiBfh_x4roBfDS0_vZQbNBpmE9y9M3t4KN0uBPaTpLlvBDL1e_05kXbMzc1jnKgYKyxikvz9pckeBRibfdfhef_IhwY0hV6QvLyglF66_6nW2oz5yFF3-IC48X_wLFl5eurKbCaF5MEUPWpsT-owIG5etd5g-X9TSj1Lllzm3qiYgLO17DdmS85gEEUrvrFOftKGkQkCBF7-F4PS-_hcJYSoVsf9GjBu1-mGHV2VL9dVGE4ROwqoAV4eNt-w3XHCL_7-VeXlRY6MjtxQU0IlakQRiMCndq5bgiYfwr97VSoUGxW9b7E8d6LJYxQiXqUVKqTr9iEZlk02VuLsUr_Pk4j_uEE8ZlmominQ2VcFnQ.brHD3vgcU9X03LwyDQi72w',
      scope: 'repository.Read repository.Write',
      expires_in: Date.now(),
      token_type: 'client_credentials',
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
    expect(beforeRequestResult.regionalDomain).toBe('a.clouddev.laserfiche.com');
  });
});
