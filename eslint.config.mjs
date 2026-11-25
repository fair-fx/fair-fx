import { builtinModules } from 'node:module';
import nx from '@nx/eslint-plugin';

const nodeBuiltins = [...builtinModules, ...builtinModules.map((name) => `node:${name}`)];

// Which package may import which. Tags are set in each package.json under "nx.tags".
// Rules for packages not created yet are already here.
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
    files: ['{packages,apps}/*/src/**/*.{ts,tsx,mts,js,mjs}'],
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
    // core main entry must run in the browser: no Node built-ins.
    files: ['packages/core/src/**/*.ts'],
    ignores: ['packages/core/src/node/**', 'packages/core/src/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: nodeBuiltins.map((name) => ({
            name,
            message: 'core main entry runs in the browser. Put Node code under src/node.',
          })),
        },
      ],
    },
  },
  {
    // dashboard runs in the browser: no Node entry of core.
    files: ['apps/dashboard/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: '@fairfx/core/node', message: 'The dashboard may only import the browser entry of core.' }],
        },
      ],
    },
  },
];
