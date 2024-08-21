// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
export interface GetAccessTokenResponse {
  access_token: string | undefined;
  expires_in: number | undefined;
  token_type: string | undefined;
  refresh_token: string | undefined;
  scope: string | undefined;
}
