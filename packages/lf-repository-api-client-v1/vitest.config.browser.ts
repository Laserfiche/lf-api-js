// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { defineConfig } from 'vitest/config';

const isCloud = process.env.AUTHORIZATION_TYPE === 'CLOUD_ACCESS_KEY';
const outputFile = isCloud ? 'junit-jsdom.xml' : 'junit-jsdom-selfhosted.xml';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    root: 'test',
    setupFiles: ['./CreateSession.ts'],
    testTimeout: 200_000,
    hookTimeout: 200_000,
    fileParallelism: false,
    sequence: { concurrent: false },
    reporters: ['default', ['junit', { outputFile }]],
    include: ['**/*.test.ts'],
  },
});
