## 1.1.15

### Maintenance

- Updated version of lf-js-utils dependency

## 1.1.14

### Maintenance

- Updated versioning on publish to for dependent libraries within this repository

## 1.1.13

### Maintenance

- Moved code to `lf-api-js` repository from `lf-api-client-core-js` repository

## 1.1.12

### Features

- Added optional `scope` parameter to `AccessKey.createClientCredentialsAuthorizationJwt` to allow scopes to be added to JWT if needed

## 1.1.11

### Maintenance

- Updated transistive dependencies to fix vulnerabilities

## 1.1.10

### Maintenance

- Updated dependency `jsrsasign` to `11.0.0` due to vulnerability

## 1.1.9

### Features

- Added `JWTUtils.getUsernameFromLfJWT` to parse username from JWT token

## 1.1.8

### Fixes

- Fixed security vulnerability issue by updating json5 dependency to version 2.2.3

## 1.1.7

### Fixes

- `ApiException` thrown from a HEAD request contains the error message obtained from the response header

## 1.1.5

### Features

- Updated function `createClientCredentialsAuthorizationJwt` with optional `expireInSeconds` parameter

## 1.1.4

### Features

- An optional `scope` parameter has been added when requesting an access token for `getAccessTokenFromCode` and `getAccessTokenFromServicePrincipal`.

## 1.1.3

### Fixes

- Errors will now be thrown with the new `ApiException` type that has a `ProblemDetails` property to match the error handling of `lf-repository-api-client-js`.

## 1.1.2

### Fixes

- Fixed import errors by adding a `.js` extension next to all the files being imported in `APIServer\TokenClient.ts` and `UsernamePasswordHandler.ts`

## 1.1.1

### Maintenance

- Updated function `createAccessToken` with unabbreviated `repositoryId` parameter name

## 1.1.0

### Features

- Added support for Self-hosted API Server

## 1.0.12

### Features

### Fixes

- **[BREAKING]** `JwtUtils`:
  - remove interface `LfEndpoints`.
  - remove function `getLfRegionalDomainFromAccountId`.
  - remove function `getLfDevEnvironmentSubDomain`.
  - remove function `getLfEndpoints`.
- **[BREAKING]** `DomainUtils`:
  - add

    ```
    interface LfEndpoints {
      webClientUrl: string;
      wsignoutUrl: string;
      regionalDomain: string;
      oauthAuthorizeUrl: string;
    }
    ```

  - add function `getLfEndpoints(regionalDomain: string): LfEndpoints`.
  - remove function `getRegionFromAccountId`.
  - remove function `getEnvironmentSubDomain`.

### Chore & Maintenance
