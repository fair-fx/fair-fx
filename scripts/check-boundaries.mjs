#!/usr/bin/env node
// Boundary canary (D-17). Lints in-memory files against the real eslint.config.mjs and
// fails if a forbidden import passes, or if an allowed one is flagged.
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { createProjectGraphAsync } from 'nx/src/devkit-exports.js';
import { depConstraints } from '../eslint.config.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const BOUNDARY_RULE = '@nx/enforce-module-boundaries';

/**
 * @typedef {{ rule: string, messageIds?: string[] }} Expected
 * @typedef {{ name: string, filePath: string, code: string, expect: Expected | null, constraints?: unknown[] }} Case
 */

/** @type {Case[]} */
const cases = [
  {
    name: 'core -> venues is rejected (diagram C, row 1)',
    filePath: 'packages/core/src/__canary__.ts',
    code: "import { parseDirection } from '@fairfx/venues';\nexport const x = parseDirection;\n",
    expect: {
      rule: BOUNDARY_RULE,
      messageIds: ['noCircularDependencies', 'emptyOnlyTagsConstraintViolation'],
    },
  },
  {
    name: 'venues -> core is allowed (positive control)',
    filePath: 'packages/venues/src/__canary__.ts',
    code: "import { isDirection } from '@fairfx/core';\nexport const x = isDirection;\n",
    expect: null,
  },
  {
    name: 'tag constraints are read from package.json and enforced',
    filePath: 'packages/venues/src/__canary__.ts',
    code: "import { isDirection } from '@fairfx/core';\nexport const x = isDirection;\n",
    constraints: depConstraints.map((c) =>
      c.sourceTag === 'layer:venues' ? { ...c, onlyDependOnLibsWithTags: ['layer:db'] } : c,
    ),
    expect: { rule: BOUNDARY_RULE, messageIds: ['onlyTagsConstraintViolation'] },
  },
  {
    name: 'core main entry cannot import a Node builtin (D-20)',
    filePath: 'packages/core/src/__canary__.ts',
    code: "import { readFileSync } from 'node:fs';\nexport const x = readFileSync;\n",
    expect: { rule: 'no-restricted-imports' },
  },
  {
    name: 'core/node entry may import a Node builtin (D-20)',
    filePath: 'packages/core/src/node/__canary__.ts',
    code: "import { readFileSync } from 'node:fs';\nexport const x = readFileSync;\n",
    expect: null,
  },
];

/**
 * @param {Case} testCase
 * @returns {Promise<string | null>} failure reason, or null when the case holds
 */
async function runCase(testCase) {
  const overrideConfig = testCase.constraints
    ? [
        {
          files: ['**/*.ts'],
          rules: {
            [BOUNDARY_RULE]: [
              'error',
              { enforceBuildableLibDependency: false, allow: [], depConstraints: testCase.constraints },
            ],
          },
        },
      ]
    : undefined;
  const eslint = new ESLint({ cwd: root, overrideConfig });
  const [result] = await eslint.lintText(testCase.code, { filePath: `${root}${testCase.filePath}` });
  if (!result) return 'ESLint returned no result';

  const errors = result.messages.filter((m) => m.severity === 2);
  const seen = errors.map((m) => `${m.ruleId ?? 'parser'}:${m.messageId ?? '-'}`).join(', ') || 'none';

  if (testCase.expect === null) {
    return errors.length === 0 ? null : `expected no errors, got ${seen}`;
  }
  const { rule, messageIds } = testCase.expect;
  const hit = errors.some(
    (m) => m.ruleId === rule && (!messageIds || (m.messageId !== undefined && messageIds.includes(m.messageId))),
  );
  return hit ? null : `expected ${rule}${messageIds ? ` (${messageIds.join(' | ')})` : ''}, got ${seen}`;
}

/**
 * Every workspace project needs exactly one layer:* or app:* tag and one scope:* tag,
 * otherwise its constraints silently stop applying.
 * @param {Record<string, { data: { tags?: string[] } }>} nodes
 * @returns {string[]} failure reasons
 */
function checkTagShape(nodes) {
  const reasons = [];
  for (const [name, node] of Object.entries(nodes)) {
    const tags = node.data.tags ?? [];
    const roles = tags.filter((t) => t.startsWith('layer:') || t.startsWith('app:'));
    const scopes = tags.filter((t) => t.startsWith('scope:'));
    if (roles.length !== 1 || scopes.length !== 1) {
      reasons.push(`${name} has tags [${tags.join(', ')}], needs one layer:/app: tag and one scope: tag`);
    }
  }
  return reasons;
}

// The boundary rule reads the cached project graph; rebuild it so tag edits are seen.
const graph = await createProjectGraphAsync({ exitOnError: true });

let failed = 0;
for (const reason of checkTagShape(graph.nodes)) {
  failed += 1;
  console.error(`FAIL  tag shape: ${reason}`);
}
if (failed === 0) console.log('ok    every project has one layer:/app: tag and one scope: tag');
for (const testCase of cases) {
  const reason = await runCase(testCase);
  if (reason === null) {
    console.log(`ok    ${testCase.name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${testCase.name}: ${reason}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} boundary check(s) failed`);
  process.exit(1);
}
console.log(`\n${cases.length} boundary cases hold`);
