# Laserfiche Repository API JS

This repository contains relevant JS libraries to get started using the Laserfiche API.

Contains the following packages:

- `@laserfiche/lf-api-client-core`
- `@laserfiche/lf-repository-api-client`
- `@laserfiche/lf-repository-api-client-v2`
- `@laserfiche/lf-api-js`

## One time setup

- Run `npm install pnpm@latest-9 -g`
- Run `pnpm install`

## To build

- To build all projects run `pnpm run build`
- To lint run: `pnpm turbo lint`

## To build a specific library

- To build all projects run `pnpm run build --filter ${name-of-library-npm-package}`
  - Ex/ `pnpm run build --filter @laserfiche/lf-repository-api-client-js`
- This will build the specified project and all dependent libaries (in this case `@laserfiche/lf-api-client-core`)

## To run a command on a specific library (for example tests)

- To run integration tests locally:
  - Create a `.env` file containing the required env variables (e.g. from \*BitWarden - github.com/Laserfiche/lf-api-js)

  ```
  AUTHORIZATION_TYPE="CLOUD_ACCESS_KEY or API_SERVER_USERNAME_PASSWORD"
  REPOSITORY_ID="***your-secret***"
  APISERVER_REPOSITORY_API_BASE_URL="***your-secret***"
  APISERVER_USERNAME="***your-secret***"
  APISERVER_PASSWORD="***your-secret***"
  REPOSITORY_ID_CLOUD="***your-secret***"
  ACCESS_KEY="***your-secret***"
  SERVICE_PRINCIPAL_KEY="***your-secret***"
  ```

- Run `pnpm --filter ${project_name} run ${script_name}`
- Test scripts for lf-js-utils:
  - `pnpm --filter @laserfiche/lf-js-utils run test`

- Test scripts for lf-api-client-core:
  - To run locally, copy .env in package root folder
  - `pnpm --filter @laserfiche/lf-api-client-core run test:unit`
  - `pnpm --filter @laserfiche/lf-api-client-core run test:Cloud`
  - `pnpm --filter @laserfiche/lf-api-client-core run test:SelfHosted`

- Test scripts for lf-repository-api-client-v1:
  - To run locally, copy .env in package root folder
  - `pnpm --filter @laserfiche/lf-repository-api-client run test:unit`
  - `pnpm --filter @laserfiche/lf-repository-api-client run test:browser`
  - `pnpm --filter @laserfiche/lf-repository-api-client run test:node`

- Test scripts for lf-repository-api-client-v2:
  - To run locally, copy .env in package root folder
  - `pnpm --filter @laserfiche/lf-repository-api-client-v2 run test:unit`
  - `pnpm --filter @laserfiche/lf-repository-api-client-v2 run test:browser`
  - `pnpm --filter @laserfiche/lf-repository-api-client-v2 run test:node`

## To publish a new package

1. Update the version in [main.yml](https://github.com/Laserfiche/lf-api-js/blob/main/.github/workflows/main.yml) for the package that you want to update
   - `NPM_API_CLIENT_V1_VERSION` for `@laserfiche/lf-repository-api-client`
   - `NPM_API_CLIENT_V2_VERSION` for `@laserfiche/lf-repository-api-client-v2`
   - `NPM_CLIENT_CORE_VERSION` for `@laserfiche/lf-api-client-core`
1. Update CHANGELOG in the folder for the package you are updating (i.e. `packages/lf-repository-api-client-v1`)
1. Run pipeline in Github and publish preview package
1. Test preview package
1. Run publish production package
