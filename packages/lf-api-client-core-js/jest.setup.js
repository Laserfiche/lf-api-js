// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Try to load .env from this package directory first
const packageEnvPath = resolve(__dirname, '.env');
// Then try the workspace root
const rootEnvPath = resolve(__dirname, '../../.env');

if (existsSync(packageEnvPath)) {
  config({ path: packageEnvPath });
} else if (existsSync(rootEnvPath)) {
  config({ path: rootEnvPath });
}
