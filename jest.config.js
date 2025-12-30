// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootSetupFile = `${__dirname}/jest.setup.js`;

/** @type {import('jest').Config} */
export default {
  testTimeout: 300000,
  projects: [
    // lf-js-utils - dom
    {
      displayName: 'lf-js-utils:dom',
      rootDir: '<rootDir>/packages/lf-js-utils',
      setupFiles: [rootSetupFile],
      preset: 'ts-jest',
      moduleDirectories: ['node_modules', '<rootDir>/src'],
      moduleFileExtensions: ['ts', 'js'],
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/tsconfig.test.json',
          },
        ],
      },
      testRegex: '(/__tests__/.*|(\\.|/)(spec))\\.ts$',
      testEnvironment: 'jsdom',
      moduleNameMapper: {
        '^./(.*).js$': './$1',
      },
    },
    // lf-js-utils - node
    {
      displayName: 'lf-js-utils:node',
      rootDir: '<rootDir>/packages/lf-js-utils',
      setupFiles: [rootSetupFile],
      preset: 'ts-jest',
      moduleDirectories: ['node_modules', '<rootDir>/src'],
      moduleFileExtensions: ['ts', 'js'],
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/tsconfig.test.json',
          },
        ],
      },
      testRegex: '(/__tests__/.*|(\\.|/)(spec))\\.ts$',
      testEnvironment: 'node',
      moduleNameMapper: {
        '^./(.*).js$': './$1',
      },
    },
    // lf-api-client-core-js - node
    {
      displayName: 'lf-api-client-core:node',
      rootDir: '<rootDir>/packages/lf-api-client-core-js/lib',
      setupFiles: [rootSetupFile],
      preset: 'ts-jest/presets/js-with-ts-esm',
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
      preset: 'ts-jest/presets/js-with-ts-esm',
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
    // lf-api-js - node
    {
      displayName: 'lf-api-js:node',
      rootDir: '<rootDir>/packages/lf-api-js/test',
      setupFiles: [rootSetupFile],
      preset: 'ts-jest/presets/js-with-ts-esm',
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
    // lf-repository-api-client-v1 - node
    {
      displayName: 'lf-repository-api-client-v1:node',
      rootDir: '<rootDir>/packages/lf-repository-api-client-v1/test',
      setupFiles: [rootSetupFile],
      preset: 'ts-jest/presets/js-with-ts-esm',
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
    // lf-repository-api-client-v2 - node
    {
      displayName: 'lf-repository-api-client-v2:node',
      rootDir: '<rootDir>/packages/lf-repository-api-client-v2/test',
      setupFiles: [rootSetupFile],
      preset: 'ts-jest/presets/js-with-ts-esm',
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
