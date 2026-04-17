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
        '<rootDir>/jest.jsdom.config.ts',
        '<rootDir>/jest.node.config.ts',
    ],
};

export default config;
