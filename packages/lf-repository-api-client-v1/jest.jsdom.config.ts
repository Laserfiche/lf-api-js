// Copyright (c) Laserfiche.
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
    },
    testEnvironment: 'jsdom',
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputName:
                    process.env.AUTHORIZATION_TYPE === 'CLOUD_ACCESS_KEY'
                        ? 'junit-jsdom.xml'
                        : 'junit-jsdom-selfhosted.xml',
            },
        ],
    ],
    setupFiles: ['./CreateSession.ts'],
    testTimeout: 200000,
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
};

export default config;