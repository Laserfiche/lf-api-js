// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import type { JestConfigWithTsJest } from 'ts-jest';

const outputName =
    process.env.APISERVER_REPOSITORY_API_BASE_URL !== undefined ? 'junit-node-selfhosted.xml' : 'junit-node.xml';

const config: JestConfigWithTsJest = {
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
    reporters: ['default', ['jest-junit', { outputName }]],
    setupFiles: ['<rootDir>/../jest.setup.ts'],
    testTimeout: 200000,
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@laserfiche/lf-js-utils$': '<rootDir>/../../lf-js-utils/dist/index.js',
    },
};

export default config;