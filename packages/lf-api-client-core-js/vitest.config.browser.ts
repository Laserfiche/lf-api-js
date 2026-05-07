// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { defineConfig } from 'vitest/config';

const isCloud = process.env.AUTHORIZATION_TYPE === 'CLOUD_ACCESS_KEY';
const outputFile = isCloud ? 'junit-jsdom.xml' : 'junit-jsdom-selfhosted.xml';

// See vitest.config.ts for the filename-suffix tagging convention.
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 200_000,
    reporters: ['default', ['junit', { outputFile }]],
    include: ['lib/**/*.{unit,integration-cloud,integration-selfhosted}.test.ts'],
  },
});
