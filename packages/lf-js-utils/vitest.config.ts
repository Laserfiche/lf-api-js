// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'dom',
          environment: 'jsdom',
          globals: true,
          include: ['src/**/*.spec.ts'],
        },
      },
      {
        test: {
          name: 'node',
          environment: 'node',
          globals: true,
          include: ['src/**/*.spec.ts'],
        },
      },
    ],
  },
});
