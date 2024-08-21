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
  testEnvironment: 'jsdom',
  reporters: ['default', ['jest-junit', { outputName: process.env.AUTHORIZATION_TYPE === 'CLOUD_ACCESS_KEY' ? 'junit-jsdom.xml' : 'junit-jsdom-selfhosted.xml' }]],
  setupFiles:['./CreateSession.ts'],
  testTimeout: 200000,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
