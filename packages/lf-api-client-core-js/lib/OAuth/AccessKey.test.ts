// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { createFromBase64EncodedAccessKey, createClientCredentialsAuthorizationJwt, AccessKey } from './AccessKey';
import { parseAccessToken } from '../utils/JwtUtils';
import 'dotenv/config';


/**
 * Unit Tests
 *
 * @group UnitTests
 */

describe('createFromBase64EncodedAccessKey', () => {
  test('createFromBase64EncodedAccessKey successfully parses base 64 string', () => {
    // Arrange
    const expectedAccessKey: AccessKey = getAccessKeyFromEnv();
    const base64EncodedAccessKey: string = getAccessKeyBase64EncodedFromEnv();

    //Act
    const decodedAccessKey: AccessKey = createFromBase64EncodedAccessKey(base64EncodedAccessKey);

    //Assert
    const accessKeyJSON: string = JSON.stringify(expectedAccessKey);
    const decodedAccessKeyJSON: string = JSON.stringify(decodedAccessKey);
    expect(decodedAccessKeyJSON).toBe(accessKeyJSON);
  });

  test.each([
    [''],
    ['     '],
    ['\n'],
    ['YXNkYXNkYXNkYXNkYWQ='],
    ['你好你好'],
    ['"This is a "string" in JS"'],
    ['c\nc'],
    ['😀 😃 😄 😁'],
  ])('create from base 64 encoded access key -> %s', (base64EncodedAccessKey) => {
    expect(() => {
      try {
        createFromBase64EncodedAccessKey(base64EncodedAccessKey);
        return false;
      } catch (err: any) {
        const msg: string | undefined = err?.message;
        return msg?.includes('Unexpected') && msg?.includes('JSON');
      }
    }).toBeTruthy();
  });
});

describe('createClientCredentialsAuthorizationJwt', () => {
  test('createClientCredentialsAuthorizationJwt successfully creates Client Credentials Authorization Jwt with default expiration time', async () => {
    // Arrange
    const accessKey: AccessKey = getAccessKeyFromEnv();
    const servicePrincipalKey: string = getServicePrincipalKeyFromEnv();

    //Act
    const authorizationToken: string = createClientCredentialsAuthorizationJwt(servicePrincipalKey, accessKey);

    //Assert
    expect(isValidJWT(authorizationToken)).toBeTruthy();
    const JWT = parseAccessToken(authorizationToken);
    type payloadType = typeof JWT.payload;
    expect(JWT.payload).toHaveProperty('exp');
    expect(JWT.payload['exp' as keyof payloadType] - JWT.payload['iat' as keyof payloadType]).toBe(3600);
  });

  test('createClientCredentialsAuthorizationJwt successfully creates Client Credentials Authorization Jwt with scopes', async () => {
    // Arrange
    const accessKey: AccessKey = getAccessKeyFromEnv();
    const servicePrincipalKey: string = getServicePrincipalKeyFromEnv();
    const testScopes: string = 'repository.Read';

    //Act
    const authorizationToken: string = createClientCredentialsAuthorizationJwt(servicePrincipalKey, accessKey, 0, testScopes);

    //Assert
    expect(isValidJWT(authorizationToken)).toBeTruthy();
    const JWT = parseAccessToken(authorizationToken);
    type payloadType = typeof JWT.payload;
    expect(JWT.payload).toHaveProperty('scope');
    expect(JWT.payload['scope' as keyof payloadType]).toBe(testScopes);
  });

  test.each([0.1, 5678])(
    'createClientCredentialsAuthorizationJwt successfully creates Client Credentials Authorization Jwt with specified expiration time -> %s',
    async (expirationTime) => {
      // Arrange
      const accessKey: AccessKey = getAccessKeyFromEnv();
      const servicePrincipalKey: string = getServicePrincipalKeyFromEnv();
  
      //Act
      const authorizationToken: string = createClientCredentialsAuthorizationJwt(
        servicePrincipalKey,
        accessKey,
        expirationTime
      );

      //Assert
      expect(isValidJWT(authorizationToken)).toBeTruthy();
      const JWT = parseAccessToken(authorizationToken);
      type payloadType = typeof JWT.payload;
      expect(JWT.payload).toHaveProperty('exp');
      expect(JWT.payload['exp' as keyof payloadType] - JWT.payload['iat' as keyof payloadType]).toBe(
        Math.ceil(expirationTime)
      );
    }
  );

  test('createClientCredentialsAuthorizationJwt successfully creates Client Credentials Authorization Jwt that never expires', async () => {
    // Arrange
    const accessKey: AccessKey = getAccessKeyFromEnv();
    const servicePrincipalKey: string = getServicePrincipalKeyFromEnv();

    //Act
    const authorizationToken: string = createClientCredentialsAuthorizationJwt(servicePrincipalKey, accessKey, 0);

    //Assert
    expect(isValidJWT(authorizationToken)).toBeTruthy();
    expect(parseAccessToken(authorizationToken).payload).not.toHaveProperty('exp');
  });

  test.each([-0.1, -3600])(
    'createClientCredentialsAuthorizationJwt fails to create Client Credentials Authorization Jwt from invalid expiration time -> %s',
    async (invalidExpiration) => {
      // Arrange
      const accessKey: AccessKey = getAccessKeyFromEnv();
      const servicePrincipalKey: string = getServicePrincipalKeyFromEnv();
  
      // Act and Assert
      expect(() => createClientCredentialsAuthorizationJwt(servicePrincipalKey, accessKey, invalidExpiration)).toThrow(
        'Expiration time must be later than the current time.'
      );
    }
  );

  test('createClientCredentialsAuthorizationJwt successfully creates Client Credentials Authorization Jwt from Base64EncodedAccessKey', async () => {
    // Arrange
    const base64EncodedAccessKey: string = getAccessKeyBase64EncodedFromEnv();
    const servicePrincipalKey = 'FakeServicePrincipalKey';

    //Act
    const authorizationToken: string = createClientCredentialsAuthorizationJwt(
      servicePrincipalKey,
      base64EncodedAccessKey
    );

    //Assert
    expect(isValidJWT(authorizationToken)).toBeTruthy();
  });

  test('createClientCredentialsAuthorizationJwt fails to create Client Credentials Authorization Jwt from bad Base64EncodedAccessKey', async () => {
    // Arrange
    const base64EncodedAccessKey: string = 'FakeAccessKey';
    const servicePrincipalKey = 'FakeServicePrincipalKey';

    //Act - Assert
    expect(() => createClientCredentialsAuthorizationJwt(servicePrincipalKey, base64EncodedAccessKey)).toThrow();
  });
});

function isValidJWT(jwt: string): boolean {
  const jwtObj = parseAccessToken(jwt);
  return jwtObj && !!jwtObj.header && !!jwtObj.payload && !!jwtObj.signature;
}

function getAccessKeyFromEnv(): AccessKey {
  const json: string = process.env.ACCESS_KEY_JSON ?? "";
  const accessKey: AccessKey = JSON.parse(json);
  return accessKey;
}

function getAccessKeyBase64EncodedFromEnv(): string {
  return process.env.ACCESS_KEY ?? "";
}

function getServicePrincipalKeyFromEnv(): string {
  return process.env.SERVICE_PRINCIPAL_KEY ?? "";
}
