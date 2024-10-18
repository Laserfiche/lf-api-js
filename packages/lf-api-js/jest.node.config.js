// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  preset: 'ts-jest/presets/js-with-ts-esm',
  transform: {
    ".*": ['ts-jest', {
      useESM: true,
    }]
  },
  testEnvironment: 'node',
  reporters: ['default', ['jest-junit', { outputName: 'junit-node.xml' }]],
  testTimeout: 200000,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  }
};
