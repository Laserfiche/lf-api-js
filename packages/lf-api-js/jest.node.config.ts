// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest/presets/default-esm',
    transform: {
        '^.+\\.(ts|tsx|js|mjs|cjs|mts|cts)$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
    testEnvironment: 'node',
    reporters: ['default', ['jest-junit', { outputName: 'junit-node.xml' }]],
    testTimeout: 200000,
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@laserfiche/lf-api-client-core$': '<rootDir>/../lf-api-client-core-js/dist/index.js',
        '^@laserfiche/lf-js-utils$': '<rootDir>/../lf-js-utils/dist/index.js',
        '^@laserfiche/lf-repository-api-client$': '<rootDir>/../lf-repository-api-client-v1/dist/index.js',
        '^@laserfiche/lf-repository-api-client-v2$': '<rootDir>/../lf-repository-api-client-v2/dist/index.js',
    },
    transformIgnorePatterns: [],
};

export default config;