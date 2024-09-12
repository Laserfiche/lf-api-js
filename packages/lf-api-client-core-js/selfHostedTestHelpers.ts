// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

// Used for self-hosted integration tests
export const username: string = process.env.APISERVER_USERNAME ?? '';
export const password: string = process.env.APISERVER_PASSWORD ?? '';
export const repositoryId: string = process.env.REPOSITORY_ID ?? '';
export const baseUrl: string =
  process.env.APISERVER_REPOSITORY_API_BASE_URL ?? '';
