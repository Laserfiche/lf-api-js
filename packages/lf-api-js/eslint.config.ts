import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint, { ConfigArray } from 'typescript-eslint';

const config: ConfigArray = defineConfig(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: ['node_modules/**', 'dist/**', 'cdn/**', 'types/**'],
    },
    {
        files: ['**/*.ts'],
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/ban-ts-comment': 'off',
            'semi': ['error', 'always'],
        },
    },
    {
        files: ['**/*.js'],
        rules: {
        },
    }
);

export default config;
