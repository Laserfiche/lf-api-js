// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default [
  {
    input: './index.ts',
    output: {
      file: 'cdn/lf-api-js.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        declaration: false
      }),
    ],
  },
];
