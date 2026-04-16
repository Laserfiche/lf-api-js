// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import type { Config } from 'jest';
import { resolve } from 'path';

const rootSetupFile = resolve(__dirname, 'jest.setup.ts');

const config: Config = {
    testTimeout: 300000,
    projects: [
        // lf-api-js - node
        {
            displayName: 'lf-api-js:node',
            rootDir: '<rootDir>/packages/lf-api-js/test',
            setupFiles: [rootSetupFile],
            preset: 'ts-jest/presets/default-esm',
            transform: {
                '^.+\\.tsx?$': [
                    'ts-jest',
                    {
                        useESM: true,
                    },
                ],
            },
            testEnvironment: 'node',
            testRegex: '\\.(unit|integration)\\.test\\.ts$',
            moduleNameMapper: {
                '^(\\.{1,2}/.*)\\.js$': '$1',
            },
        },
    ],
};

export default config;