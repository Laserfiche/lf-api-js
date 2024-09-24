// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from './TestHelper.js';
import { IRepositoryApiClient } from '../index.js';
import { createClient } from './BaseTest.js';
let _RepositoryApiClient: IRepositoryApiClient;
_RepositoryApiClient = createClient();
export { repositoryId, _RepositoryApiClient };
