import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['**/dist/**', '**/coverage/**', 'contracts/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['{packages,apps}/*/src/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ regex: '^\\.', message: 'Import from the package barrel, e.g. @fair-fx/core.' }] },
      ],
    },
  },
);
