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
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_|^prefer$|^ClientBase$' }],
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
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
