import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint, { ConfigArray } from 'typescript-eslint';

const config: ConfigArray = defineConfig(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: ['node_modules/**', 'dist/**'],
    },
    {
        files: ['**/*.ts'],
        rules: {
            'semi': ['error', 'always'],
        },
    }
);

export default config;
