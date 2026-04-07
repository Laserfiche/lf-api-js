// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    root: 'test',
    setupFiles: ['./CreateSession.ts'],
    testTimeout: 200_000,
    fileParallelism: false,
    sequence: { concurrent: false },
    reporters: ['default'],
    include: ['**/*.test.ts'],
  },
});
