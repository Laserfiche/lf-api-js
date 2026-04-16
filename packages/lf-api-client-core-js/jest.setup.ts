// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Suppress Jest 30 deprecation warnings from ts-jest
// See: https://github.com/jestjs/jest/issues/14980
const originalEmit = process.emit.bind(process);
process.emit = function (event: string, ...args: unknown[]) {
    if (event === 'warning' && typeof args[0] === 'object' && args[0] !== null) {
        const warning = args[0] as { name?: string; message?: string };
        if (warning.name === 'DeprecationWarning' && warning.message?.includes('customEqualityTesters')) {
            return false;
        }
    }
    return originalEmit(event, ...args);
};

// Try to load .env from the current working directory
const cwd = process.cwd();
const packageEnvPath = resolve(cwd, '.env');
// Then try the workspace root (if running from package dir)
const rootEnvPath = resolve(cwd, '../../.env');

if (existsSync(packageEnvPath)) {
    config({ path: packageEnvPath });
} else if (existsSync(rootEnvPath)) {
    config({ path: rootEnvPath });
}
