// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

const { config } = require('dotenv');
const { existsSync } = require('fs');
const { resolve } = require('path');

// Load from the root .env if it exists
const rootEnvPath = resolve(__dirname, '.env');
if (existsSync(rootEnvPath)) {
  config({ path: rootEnvPath });
}
