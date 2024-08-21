# Laserfiche Repository API JS

This repository contains relevant JS libraries to get started using the Laserfiche API.

It is the future replacement of repositories:

- [lf-api-client-core-js](https://github.com/Laserfiche/lf-api-client-core-js)
- [lf-repository-api-client-js](https://github.com/Laserfiche/lf-repository-api-client-js)

## One time setup

- Run `npm install pnpm -g`

## To build

- To build all projects run `pnpm run build`

## To build a specific library

- To build all projects run `pnpm run build --filter ${name-of-library-npm-package}`
  - Ex/ `pnpm run build --filter @laserfiche/lf-repository-api-client-js`
- This will build the specified project and all dependent libaries (in this case `@laserfiche/lf-api-client-core`)

## To run a command on a specific library (for example tests)

- Run `pnpm --filter ${project_name} run ${script_name}`
- Example to run the "cloud" tests on `@laserfiche/lf-api-client-core` run `pnpm --filter @laserfiche/lf-api-client-core run test:Cloud`
