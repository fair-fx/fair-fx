import { resolve } from 'node:path';
import { ESLint, type Linter } from 'eslint';

const repoRoot = resolve(import.meta.dirname, '../..');

export interface LintImportOptions {
  /** Replaces the real dependency constraints for this one lint run. */
  depConstraints?: unknown[];
}

/** Lints a one-line file at `file` that imports `specifier`. Returns the rule ids of the errors. */
export async function lintImport(file: string, specifier: string, options: LintImportOptions = {}): Promise<string[]> {
  const eslint = new ESLint({ cwd: repoRoot, overrideConfig: overrideFor(options) });
  const code = `import * as target from '${specifier}';\nexport { target };\n`;
  const [result] = await eslint.lintText(code, { filePath: resolve(repoRoot, file) });
  if (!result) throw new Error(`ESLint returned no result for ${file}`);
  return result.messages.filter((m) => m.severity === 2).map((m) => m.ruleId ?? 'parse-error');
}

function overrideFor({ depConstraints }: LintImportOptions): Linter.Config[] | undefined {
  if (!depConstraints) return undefined;
  return [
    {
      files: ['**/*.ts'],
      rules: {
        '@nx/enforce-module-boundaries': ['error', { enforceBuildableLibDependency: false, allow: [], depConstraints }],
      },
    },
  ];
}
