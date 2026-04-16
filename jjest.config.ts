// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import type { Config } from 'jest';

const config: Config = {
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputName: 'junit.xml',
            },
        ],
    ],
    projects: [
        {
            displayName: 'lf-js-utils-jsdom',
            preset: 'ts-jest/presets/default-esm',
            setupFiles: ['<rootDir>/jest.setup.ts'],
            moduleDirectories: ['node_modules', '<rootDir>'],
            moduleFileExtensions: ['ts', 'js'],
            transform: {
                '^.+\\.ts$': [
                    'ts-jest',
                    {
                        tsconfig: 'tsconfig.test.json',
                    },
                ],
            },
            testRegex: '(/__tests__/.*|(\\.|/)(spec))\\.ts$',
            testEnvironment: 'jsdom',
            moduleNameMapper: {
                '^./(.*).js$': './$1',
            },
        },
        {
            displayName: 'lf-js-utils-node',
            preset: 'ts-jest/presets/default-esm',
            setupFiles: ['<rootDir>/jest.setup.ts'],
            moduleDirectories: ['node_modules', '/src'],
            moduleFileExtensions: ['ts', 'js'],
            transform: {
                '^.+\\.ts$': [
                    'ts-jest',
                    {
                        tsconfig: 'tsconfig.test.json',
                    },
                ],
            },
            testRegex: '(/__tests__/.*|(\\.|/)(spec))\\.ts$',
            testEnvironment: 'node',
            moduleNameMapper: {
                '^./(.*).js$': './$1',
            },
        },
    ],
};

export default config;
