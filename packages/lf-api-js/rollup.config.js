// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: './index.ts',
    output: {
      file: 'dist/cdn/lf-api-js.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        sourceMap: true,
        inlineSources: true,
      }),
    ],
  },
  {
    input: './dist/index.d.ts',
    output: [{ file: 'dist/types/bundle.d.ts', format: 'es' }],
    plugins: [dts({ rollupTypes: true, respectExternal: true })],
  },
];
