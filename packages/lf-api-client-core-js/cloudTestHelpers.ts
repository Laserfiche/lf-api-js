// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import {
  AccessKey,
  createFromBase64EncodedAccessKey,
} from './lib/OAuth/AccessKey.js';

// Used for Cloud Integration tests
export const envServicePrincipalKey: string =
  process.env.SERVICE_PRINCIPAL_KEY ?? '';
if (!envServicePrincipalKey) {
  throw new Error(`Unable to load SERVICE_PRINCIPAL_KEY from .env`);
}
let accessKeyBase64: string = process.env.ACCESS_KEY ?? '';
if (!accessKeyBase64) {
  throw new Error(`Unable to load ACCESS_KEY from .env`);
}
export const accessKey: AccessKey = createFromBase64EncodedAccessKey(
  accessKeyBase64 ?? ''
);
