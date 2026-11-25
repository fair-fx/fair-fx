import { builtinModules } from 'node:module';
import nx from '@nx/eslint-plugin';

const nodeBuiltins = [...builtinModules, ...builtinModules.map((name) => `node:${name}`)];

// Dependency direction from architecture.md §1 (D-17, D-25, D-26): one allowed edge per
// arrow of the repo-structure diagram, direct imports only. Tags live in each package.json
// under "nx.tags". Constraints for packages that do not exist yet are declared now so a new
// package is bound from its first commit.
export const depConstraints = [
  { sourceTag: 'scope:public', onlyDependOnLibsWithTags: ['scope:public'] },
  { sourceTag: 'scope:private', onlyDependOnLibsWithTags: ['scope:public', 'scope:private'] },

  { sourceTag: 'layer:core', onlyDependOnLibsWithTags: [] },
  { sourceTag: 'layer:venues', onlyDependOnLibsWithTags: ['layer:core'] },
  { sourceTag: 'layer:db', onlyDependOnLibsWithTags: ['layer:core'] },
  { sourceTag: 'layer:api-schema', onlyDependOnLibsWithTags: ['layer:core'] },
  { sourceTag: 'layer:ui', onlyDependOnLibsWithTags: [] },
  { sourceTag: 'layer:sdk', onlyDependOnLibsWithTags: ['layer:venues', 'layer:api-schema'] },
  { sourceTag: 'layer:cli', onlyDependOnLibsWithTags: ['layer:sdk'] },

  { sourceTag: 'app:collector', onlyDependOnLibsWithTags: ['layer:venues', 'layer:db'] },
  { sourceTag: 'app:api', onlyDependOnLibsWithTags: ['layer:db', 'layer:api-schema'] },
  { sourceTag: 'app:dashboard', onlyDependOnLibsWithTags: ['layer:api-schema', 'layer:core', 'layer:ui'] },
];

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', 'contracts/**', '.nx/**'],
  },
  {
    files: ['**/*.ts', '**/*.mts', '**/*.js', '**/*.mjs'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: false,
          allow: [],
          depConstraints,
        },
      ],
    },
  },
  {
    // D-20: the main entry of core does no I/O and runs in the browser.
    files: ['packages/core/src/**/*.ts'],
    ignores: ['packages/core/src/node/**', 'packages/core/src/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: nodeBuiltins.map((name) => ({
            name,
            message: 'The main entry of @fairfx/core has no I/O (D-20). Put Node code under src/node.',
          })),
        },
      ],
    },
  },
  {
    // D-20: the dashboard imports only the browser-safe entry of core.
    files: ['apps/dashboard/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: '@fairfx/core/node', message: 'The dashboard imports only the browser entry of core (D-20).' }],
        },
      ],
    },
  },
];
