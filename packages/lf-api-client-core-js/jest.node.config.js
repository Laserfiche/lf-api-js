// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  preset: 'ts-jest/presets/js-with-ts-esm',
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  testEnvironment: 'node',
  modulePathIgnorePatterns: ["PKCEUtils.test.ts"],
  reporters: ["default", ["jest-junit", { outputName: "junit-node.xml" }]],
  testTimeout:200000,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  runner: "groups"
};
