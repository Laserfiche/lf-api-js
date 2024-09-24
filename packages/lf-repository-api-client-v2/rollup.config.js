// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
    input: './index.ts',
    output: {
        file: 'dist/lf-repository-api-client-v2.esm.js',
        format: 'esm'
    },
    plugins: [
        resolve(),
        commonjs(),
        typescript()
    ]
}
