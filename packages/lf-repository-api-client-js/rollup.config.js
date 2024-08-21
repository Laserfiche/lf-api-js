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