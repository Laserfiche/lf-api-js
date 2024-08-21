// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import 'dotenv/config';
import { AccessKey, createFromBase64EncodedAccessKey } from './lib/OAuth/AccessKey.js';
export const testServicePrincipalKey: string = process.env.SERVICE_PRINCIPAL_KEY ?? '';
if (!testServicePrincipalKey) {
  throw new Error(`Unable to load SERVICE_PRINCIPAL_KEY from .env`);
}
let accessKeyBase64: string = process.env.ACCESS_KEY ?? '';
if (!accessKeyBase64) {
  throw new Error(`Unable to load ACCESS_KEY from .env`);
}
export const accessKey: AccessKey = createFromBase64EncodedAccessKey(accessKeyBase64 ?? '');
export const username: string = process.env.APISERVER_USERNAME ?? '';
export const password: string = process.env.APISERVER_PASSWORD ?? '';
export const repositoryId: string = process.env.REPOSITORY_ID ?? '';
export const baseUrl: string = process.env.APISERVER_REPOSITORY_API_BASE_URL ?? '';
