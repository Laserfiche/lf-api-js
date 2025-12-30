// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from './TestHelper.js';
import { IRepositoryApiClient } from '../index.js';
import { createClient } from './BaseTest.js';
const _RepositoryApiClient: IRepositoryApiClient = createClient();
export { repositoryId, _RepositoryApiClient };
