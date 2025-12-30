import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['node_modules/**', 'dist/**', 'cdn/**', 'types/**'],
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': 'off',
      'semi': ['error', 'always'],
    },
  },
  {
    files: ['**/*.js'],
    rules: {
      'no-useless-escape': 'off',
    },
  }
);
