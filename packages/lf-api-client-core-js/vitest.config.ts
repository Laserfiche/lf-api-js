// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { defineConfig } from 'vitest/config';

const isCloud = process.env.AUTHORIZATION_TYPE === 'CLOUD_ACCESS_KEY';
const outputFile = isCloud ? 'junit-node.xml' : 'junit-node-selfhosted.xml';

// Tests are tagged via filename suffix (filename convention replaces jest-runner-groups):
//   *.unit.test.ts                    — UnitTests group
//   *.integration-cloud.test.ts       — IntegrationTests/Cloud group
//   *.integration-selfhosted.test.ts  — IntegrationTests/SelfHosted group
// PKCEUtils.test.ts keeps its plain `.test.ts` extension so it stays excluded
// (it's broken under jsdom — see TODO inside the file).
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 200_000,
    reporters: ['default', ['junit', { outputFile }]],
    include: ['lib/**/*.{unit,integration-cloud,integration-selfhosted}.test.ts'],
  },
});
