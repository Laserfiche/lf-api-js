// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import type { Config } from 'jest';
import { resolve } from 'path';

const rootSetupFile = resolve(__dirname, 'jest.setup.ts');

const config: Config = {
    testTimeout: 300000,
    projects: [
        // lf-api-client-core-js - node
        {
            displayName: 'lf-api-client-core:node',
            rootDir: '<rootDir>/packages/lf-api-client-core-js/lib',
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
            testRegex: '\\.(unit|cloud|selfhosted|integration)\\.test\\.ts$',
            moduleNameMapper: {
                '^(\\.{1,2}/.*)\\.js$': '$1',
            },
        },
        // lf-api-client-core-js - jsdom
        {
            displayName: 'lf-api-client-core:jsdom',
            rootDir: '<rootDir>/packages/lf-api-client-core-js/lib',
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
            testEnvironment: 'jsdom',
            testRegex: '\\.(unit|cloud|selfhosted|integration)\\.test\\.ts$',
            modulePathIgnorePatterns: ['PKCEUtils.unit.test.ts'],
            moduleNameMapper: {
                '^(\\.{1,2}/.*)\\.js$': '$1',
            },
        },
    ],
};

export default config;