// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import {
  AccessKey,
  GetAccessTokenResponse,
  OAuthClientCredentialsHandler,
} from '@laserfiche/lf-api-client-core';
import { LfApiClient } from '../index.js';

describe('API JS Tests', () => {
  test('Create api js client from access key succeeds', () => {
    // Arrange
    let testAccessKeyJSON: string = `{
        "customerId": "123456789",
        "clientId": "525524b2-afe6-47ca-8ed7-98262651047f",
        "domain": "a.clouddev.laserfiche.com",
        "jwk": {
          "kty": "EC",
          "crv": "P-256",
          "use": "sig",
          "kid": "uGHpMS2KM8vMi1X_eKnE7hOJiQ_2sQNT8rOS2Jl2rIs",
          "x": "n9lA6bKMu_2qAjHyCta4ZGrKNClIpskvwS61Gn9WFZw",
          "y": "K6g8XmvM6PcgQD4NOsBoU-Ly_xa7_3AH8vs6YfHtnIU",
          "d": "cYrEewJSOJYnvqU11fA7OQzHMSjPBu2mGYWeQJ5cAuQ",
          "createdTime": "2024-09-12T18:58:44.5957817Z"
        }
      }`;

    let testAccessKeyFromJson: AccessKey = JSON.parse(testAccessKeyJSON);

    let testServicePrincipalKey: string = 'BxLS6xxrW4Ln2aP_n6kU';

    // Act
    let apiClient = LfApiClient.createFromAccessKey(
      testServicePrincipalKey,
      testAccessKeyFromJson
    );

    // Assert
    expect(apiClient).toBeDefined();
    expect(apiClient.repositoryApiClientV1).toBeDefined();
    expect(apiClient.repositoryApiClientV2).toBeDefined();
  });

  test('Create api js client from getAccessTokenFunc succeeds', () => {
    // Arrange
    var validAccessToken: GetAccessTokenResponse = {
      access_token:
        'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhLmNsb3VkZGV2Lmxhc2VyZmljaGUuY29tIiwiaXNzIjoiaHR0cHM6Ly9zaWduaW4uYS5jbG91ZGRldi5sYXNlcmZpY2hlLmNvbS9vYXV0aC9Ub2tlbiIsImV4cCI6MTcyNzg5OTk3MCwibmJmIjoxNzI3ODk1NzY5LCJzdWIiOiJhbGV4YW5kcmlhLmdvbWV6QGxhc2VyZmljaGUuY29tIiwiY2xpZW50X2lkIjoiYjkxUGdHUjJkUXBlWWVMMnM3OTBWWTB3IiwiY3NpZCI6IjEyMzQ1Njc4OSIsInRyaWQiOiIxMDExIiwibmFtZSI6ImFsZXhhbmRyaWEuZ29tZXoiLCJ1dHlwIjoiRnVsbCIsImd0aWQiOiIxMDc1MTUiLCJhY3NzayI6InlVdFVaMlVTbDNqTENVRktZQkczWVlJMTB2c1F4T01HVlBwWWFxUE1UUlNPRDBGT2VRU1VVQkRPRXQ3WG13REMiLCJ0Y2lkIjoiMDlhMTM4YjgtNTdjNi00ZWRiLTk0OTEtMGM0M2ZkYjNhZjNmIiwic2NvcGUiOiJyZXBvc2l0b3J5LlJlYWQgcmVwb3NpdG9yeS5Xcml0ZSIsImFzc2V0cyI6IntcIkxhc2VyZmljaGVBcGlcIjoyMDR9IiwiaWF0IjoxNzI3ODk2MzcwfQ.mgn9gG5wOgdyyS0ea-6thYT30Ei3baCnTuSaNnUNE93c0AUIVzACFr7glStAcVY0HPv8MTjHWvbaEtYdkF93Nw',
      refresh_token:
        'eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwidHlwIjoiSldUIiwiY3R5IjoiSldUIn0..iuuKcxw1RDSPrsvhVbq76w.zdB8EanC3UJEneWY3IVtMBPF0ohQueSnD1owEtXNAJYy1yxRB2yh9pSAhHeoWGQsgaEbl9gVYTHrrHLxDxwp-5f6FOShL-CcOzzATaAg2JEQZbamVgDqTiM0f0jxyMPbe-BJwEStD0F5IstVwpvbgCZ9-GI2dD3TR-tzifbekWyqo1OmF38Sc40F9mIkHh1N5pKTRhxxz12mfygUfnOZOmK7LhfVb1Ej-RDRBnadBfGVxqYTKXxzH7p8wHbjqNgfpfJZL8KUffi-I9BeMxNAdWrcFgr240r0wUPJxHXYZrQDhAWXDhxkYoXD8h46Cv0vDlGmVG_Zdj0FRb5OzMiBZMIT-KqxPW1Xw11robZCYoh7eZ1_GC9ZaN-5u6Xhimg4DZIjyTIx_NTG0KR1CkXefb5MkB3a1-xUJLuVWdHn3agCdnPX3jY2lqC5FMTHVd9-RQCitL1Ypoy_4dBIqBnIkXaKNg_NFO1y39dAQsCaRyhX-85P_jmBbIgCUGvAIKNJao87qesxrLdFcJCz6hstyUOOIymDGI_3iw3BTtR8HgrtaUwxSHmXLcqJcsR8UqPIy7BZ1ioUJ1MqJVenbe61tB-rAm5IbCeiNpzRLcVqkDTxlcfMszuxILOhxZ_Lg4cFej27dM1xvx92M1Q4rJxIqgrvQCklg7wm_8a2Ofp1TP3slAo8sqqphPApGP5oMLG2tLu6e8JhMxPUO6TzLB9N6czY2k2WW3HV1yt9WWg9dRbo96qM5h2dW5Pag-PaOckon9n3xuhVC0szn_GWfIia3ReMYR9j_OIE-xvF8KdqjYbPZiBfh_x4roBfDS0_vZQbNBpmE9y9M3t4KN0uBPaTpLlvBDL1e_05kXbMzc1jnKgYKyxikvz9pckeBRibfdfhef_IhwY0hV6QvLyglF66_6nW2oz5yFF3-IC48X_wLFl5eurKbCaF5MEUPWpsT-owIG5etd5g-X9TSj1Lllzm3qiYgLO17DdmS85gEEUrvrFOftKGkQkCBF7-F4PS-_hcJYSoVsf9GjBu1-mGHV2VL9dVGE4ROwqoAV4eNt-w3XHCL_7-VeXlRY6MjtxQU0IlakQRiMCndq5bgiYfwr97VSoUGxW9b7E8d6LJYxQiXqUVKqTr9iEZlk02VuLsUr_Pk4j_uEE8ZlmominQ2VcFnQ.brHD3vgcU9X03LwyDQi72w',
      scope: 'repository.Read repository.Write',
      expires_in: Date.now(),
      token_type: 'client_credentials',
    };

    // Act
    let apiClient = LfApiClient.createFromGetAccessTokenFunc(
      async () => validAccessToken
    );

    // Assert
    expect(apiClient).toBeDefined();
    expect(apiClient.repositoryApiClientV1).toBeDefined();
    expect(apiClient.repositoryApiClientV2).toBeDefined();
  });

  test('Create api js client from HttpRequestHandler succeeds', () => {
    // Arrange
    let testAccessKeyJSON: string = `{
        "customerId": "123456789",
        "clientId": "525524b2-afe6-47ca-8ed7-98262651047f",
        "domain": "a.clouddev.laserfiche.com",
        "jwk": {
          "kty": "EC",
          "crv": "P-256",
          "use": "sig",
          "kid": "uGHpMS2KM8vMi1X_eKnE7hOJiQ_2sQNT8rOS2Jl2rIs",
          "x": "n9lA6bKMu_2qAjHyCta4ZGrKNClIpskvwS61Gn9WFZw",
          "y": "K6g8XmvM6PcgQD4NOsBoU-Ly_xa7_3AH8vs6YfHtnIU",
          "d": "cYrEewJSOJYnvqU11fA7OQzHMSjPBu2mGYWeQJ5cAuQ",
          "createdTime": "2024-09-12T18:58:44.5957817Z"
        }
      }`;

    let testAccessKeyFromJson: AccessKey = JSON.parse(testAccessKeyJSON);

    let testServicePrincipalKey: string = 'BxLS6xxrW4Ln2aP_n6kU';
    let httpRequestHandler = new OAuthClientCredentialsHandler(
      testServicePrincipalKey,
      testAccessKeyFromJson
    );

    // Act
    let apiClient =
      LfApiClient.createFromHttpRequestHandler(httpRequestHandler);

    // Assert
    expect(apiClient).toBeDefined();
    expect(apiClient.repositoryApiClientV1).toBeDefined();
    expect(apiClient.repositoryApiClientV2).toBeDefined();
  });
});
