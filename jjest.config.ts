// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import type { Config } from 'jest';

const includeRepositoryIntegrationTests = Boolean(process.env.AUTHORIZATION_TYPE);

const config: Config = {
    projects: [
        '<rootDir>/packages/lf-js-utils/jest.jsdom.config.ts',
        '<rootDir>/packages/lf-js-utils/jest.node.config.ts',
        '<rootDir>/packages/lf-api-client-core-js/jest.jsdom.config.ts',
        '<rootDir>/packages/lf-api-client-core-js/jest.node.config.ts',
        '<rootDir>/packages/lf-api-js/jest.node.config.ts',
        ...(includeRepositoryIntegrationTests
            ? [
                '<rootDir>/packages/lf-repository-api-client-v1/jest.node.config.ts',
                '<rootDir>/packages/lf-repository-api-client-v1/jest.jsdom.config.ts',
                '<rootDir>/packages/lf-repository-api-client-v2/jest.node.config.ts',
                '<rootDir>/packages/lf-repository-api-client-v2/jest.jsdom.config.ts',
            ]
            : []),
    ],
};

export default config;
