# Laserfiche Repository API JS

This repository contains relevant JS libraries to get started using the Laserfiche API.

Contains the following packages:

- `@laserfiche/lf-api-client-core`
- `@laserfiche/lf-repository-api-client`
- `@laserfiche/lf-repository-api-client-v2`
- `@laserfiche/lf-api-js`

## One time setup

- Run `npm install pnpm -g`
- Run `pnpm install`

## To build

- To build all projects run `pnpm run build`

## To build a specific library

- To build all projects run `pnpm run build --filter ${name-of-library-npm-package}`
  - Ex/ `pnpm run build --filter @laserfiche/lf-repository-api-client-js`
- This will build the specified project and all dependent libaries (in this case `@laserfiche/lf-api-client-core`)

## To run a command on a specific library (for example tests)

- Run `pnpm --filter ${project_name} run ${script_name}`
- Example to run the "cloud" tests on `@laserfiche/lf-api-client-core` run `pnpm --filter @laserfiche/lf-api-client-core run test:Cloud`

## To publish a new package

1. Update the version in [main.yml](https://github.com/Laserfiche/lf-api-js/blob/main/.github/workflows/main.yml) for the package that you want to update
    - `NPM_API_CLIENT_V1_VERSION` for `@laserfiche/lf-repository-api-client`
    - `NPM_API_CLIENT_V2_VERSION` for `@laserfiche/lf-repository-api-client-v2`
    - `NPM_CLIENT_CORE_VERSION` for `@laserfiche/lf-api-client-core`
1. Update CHANGELOG  in the folder for the package you are updating (i.e. `packages/lf-repository-api-client-v1`)
1. Run pipeline in Github and publish preview package
1. Test preview package
1. Run publish production package
