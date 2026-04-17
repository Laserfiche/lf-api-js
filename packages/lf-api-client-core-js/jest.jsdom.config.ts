// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import type { JestConfigWithTsJest } from 'ts-jest';

const outputName =
    process.env.APISERVER_REPOSITORY_API_BASE_URL !== undefined ? 'junit-jsdom-selfhosted.xml' : 'junit-jsdom.xml';
const includeEnvironmentDependentTests = Boolean(process.env.AUTHORIZATION_TYPE);

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
    testEnvironment: 'jsdom',
    reporters: ['default', ['jest-junit', { outputName }]],
    setupFiles: ['<rootDir>/jest.setup.ts'],
    testTimeout: 200000,
    testPathIgnorePatterns: includeEnvironmentDependentTests
        ? []
        : ['\\.(cloud|selfhosted|integration)\\.test\\.ts$'],
    modulePathIgnorePatterns: ['PKCEUtils.unit.test.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@laserfiche/lf-js-utils$': '<rootDir>/../lf-js-utils/dist/index.js',
    },
};

export default config;