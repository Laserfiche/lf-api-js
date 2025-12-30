// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  projects: [
    {
      displayName: 'dom',
      preset: 'ts-jest',
      moduleDirectories: ['node_modules', '/src'],
      moduleFileExtensions: ['ts', 'js'],
      reporters: ['default', 'jest-junit'],
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
        "^./(.*).js$": "./$1",
      }
    },
    {
      displayName: 'node',
      preset: 'ts-jest',
      moduleDirectories: ['node_modules', '/src'],
      moduleFileExtensions: ['ts', 'js'],
      reporters: ['default', 'jest-junit'],
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
        "^./(.*).js$": "./$1",
      },
    }
  ]
};