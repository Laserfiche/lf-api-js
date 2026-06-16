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
    // Match testTimeout: setup/teardown hooks make the same dev-CA round-trips as the tests
    // (e.g. CheckInCheckOut afterEach: undoCheckOut + unlockDocument + startDeleteEntry). The
    // default hookTimeout is 10s, inconsistent with the 200s test budget, and trips on a
    // slow/contended shared dev repository even though no single call hangs.
    hookTimeout: 200_000,
    fileParallelism: false,
    sequence: { concurrent: false },
    reporters: ['default', 'junit'],
    outputFile: { junit: '../junit-browser.xml' },
    include: ['**/*.test.ts'],
  },
});
