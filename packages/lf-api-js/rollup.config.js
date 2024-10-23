// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default [
  {
    input: './index.ts',
    output: {
      file: 'cdn/lf-api-js.mjs',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        declaration: false
      }),
      terser()
    ],
  },
];
