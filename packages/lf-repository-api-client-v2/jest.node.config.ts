// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest/presets/default-esm',
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
        '^.+\\.js$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
    testEnvironment: 'node',
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputName:
                    process.env.AUTHORIZATION_TYPE === 'CLOUD_ACCESS_KEY'
                        ? 'junit-node.xml'
                        : 'junit-node-selfhosted.xml',
            },
        ],
    ],
    setupFiles: ['./test/CreateSession.ts'],
    testTimeout: 200000,
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transformIgnorePatterns: ['node_modules/(?!(@laserfiche)/)'],
};

export default config;