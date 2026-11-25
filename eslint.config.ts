import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

// Code style only. Import rules between packages live in .dependency-cruiser.ts.
export default defineConfig(
  { ignores: ['**/dist/**', '**/coverage/**', 'contracts/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    // Tests use the package the way other packages do: through its barrel.
    files: ['{packages,apps}/*/src/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ regex: '^\\.', message: 'Import from the package barrel, e.g. @fairfx/core.' }] },
      ],
    },
  },
);
