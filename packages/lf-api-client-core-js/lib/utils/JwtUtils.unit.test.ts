// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import * as JwtUtils from './JwtUtils.js';

/**
 * Unit Tests
 *
 * @group UnitTests
 */

describe('JwtUtils', () => {

  it('getAccountIdFromLfJWT returns the account id', () => {
    // Arrange
    const jwt: JwtUtils.JWT = {
      header: { "typ": "JWT" },
      payload: { "csid": "123456789" },
      signature: "_signature"
    };
    const expectedAccountId = '123456789';

    // Act
    const accountId = JwtUtils.getAccountIdFromLfJWT(jwt);

    // Assert
    expect(accountId).toEqual(expectedAccountId);
  });

  it('getUsernameFromLfJWT returns the username', () => {
    // Arrange
    const jwt: JwtUtils.JWT = {
      header: { "typ": "JWT" },
      payload: { "name": "test_user" },
      signature: "_signature"
    };
    const expectedUsername = 'test_user';

    // Act
    const username = JwtUtils.getUsernameFromLfJWT(jwt);

    // Assert
    expect(username).toEqual(expectedUsername);
  });

  it('getTrusteeIdFromLfJWT returns the trustee id', () => {
    // Arrange
    const jwt: JwtUtils.JWT = {
      header: { "typ": "JWT" },
      payload: { "trid": "1008" },
      signature: "_signature"
    };
    const expectedTrusteeId = '1008';

    // Act
    const trid = JwtUtils.getTrusteeIdFromLfJWT(jwt);

    // Assert
    expect(trid).toEqual(expectedTrusteeId);
  });

  it('parseAccessToken parses a base64-encoded jwt', () => {
    // Arrange
    const jwtString = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9l
    IiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`; // copy from https://jwt.io/
    const expectedJWT: JwtUtils.JWT = {
      header:
      {
        "alg": "HS256",
        "typ": "JWT"
      },
      payload:
      {
        "sub": "1234567890",
        "name": "John Doe",
        "iat": 1516239022
      },
      signature: 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    };

    // Act
    const jwt = JwtUtils.parseAccessToken(jwtString);

    // Assert
    expect(jwt).toEqual(expectedJWT);

  });

});
