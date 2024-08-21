// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { getRepositoryEndpoint, getLfEndpoints, LfEndpoints, getOauthTokenUrl } from './DomainUtils.js';

/**
 * Unit Tests
 *
 * @group UnitTests
 */

describe('DomainUtil', () => {

  it('getRepositoryEndpoint returns correct endpoint', () => {
    let result = getRepositoryEndpoint('laserfiche.com');

    expect(result).toBe(`https://api.laserfiche.com/repository`);
  });

  it('getOauthTokenUrl returns correct endpoint', () => {
    let result = getOauthTokenUrl('laserfiche.com');

    expect(result).toBe(`https://signin.laserfiche.com/oauth/Token`);
  });

  it('getLfEndpoints returns the region-specific Laserfiche Cloud endpoints', () => {
    // Arrange
    const regionalDomain = 'laserfiche.com';
    const expectedEndpoints: LfEndpoints = {
      webClientUrl: 'https://app.laserfiche.com/laserfiche',
      wsignoutUrl: 'https://accounts.laserfiche.com/WebSTS/?wa=wsignout1.0',
      regionalDomain: 'laserfiche.com',
      oauthAuthorizeUrl: 'https://signin.laserfiche.com/oauth/Authorize',
    };

    // Act
    const endpoints = getLfEndpoints(regionalDomain);

    // Assert
    expect(endpoints).toEqual(expectedEndpoints);
  });
});
