import { readCachedProjectGraph } from '@nx/devkit';
import { describe, expect, it } from 'vitest';
import { depConstraints } from '../../eslint.config.mjs';
import { lintImport } from './lint-import.js';

const BOUNDARY = '@nx/enforce-module-boundaries';
const NO_IO = 'no-restricted-imports';

describe('forbidden imports fail lint', () => {
  it.each([
    { file: 'packages/core/src/x.ts', imports: '@fairfx/venues', rule: BOUNDARY, why: 'core depends on no package' },
    { file: 'packages/core/src/x.ts', imports: 'node:fs', rule: NO_IO, why: 'core main entry runs in the browser' },
  ])('$file -> $imports ($why)', async ({ file, imports, rule }) => {
    expect(await lintImport(file, imports)).toContain(rule);
  });
});

describe('allowed imports pass lint', () => {
  it.each([
    { file: 'packages/venues/src/x.ts', imports: '@fairfx/core' },
    { file: 'packages/core/src/node/x.ts', imports: 'node:fs' },
  ])('$file -> $imports', async ({ file, imports }) => {
    expect(await lintImport(file, imports)).toEqual([]);
  });
});

describe('tags', () => {
  it('every project has one layer: or app: tag and one scope: tag', () => {
    for (const [name, node] of Object.entries(readCachedProjectGraph().nodes)) {
      const tags = node.data.tags ?? [];
      const roles = tags.filter((t) => t.startsWith('layer:') || t.startsWith('app:'));
      const scopes = tags.filter((t) => t.startsWith('scope:'));
      expect({ name, roles: roles.length, scopes: scopes.length }).toEqual({ name, roles: 1, scopes: 1 });
    }
  });

  // core -> venues fails as a cycle before tags are checked, so this case proves the tag rule itself runs.
  it('venues -> core fails once venues may no longer depend on core', async () => {
    const venuesWithoutCore = depConstraints.map((c) =>
      c.sourceTag === 'layer:venues' ? { ...c, onlyDependOnLibsWithTags: ['layer:db'] } : c,
    );
    const errors = await lintImport('packages/venues/src/x.ts', '@fairfx/core', { depConstraints: venuesWithoutCore });
    expect(errors).toContain(BOUNDARY);
  });
});
