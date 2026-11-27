import type { IConfiguration, IForbiddenRuleType } from 'dependency-cruiser';

// Which package may import which other package. A package not listed here may import none.
const allowed: Record<string, string[]> = {
  'packages/core': [],
  'packages/venues': ['packages/core'],
  'packages/db': ['packages/core'],
  'packages/api-schema': ['packages/core'],
  'packages/ui': [],
  'packages/sdk': ['packages/core', 'packages/venues', 'packages/api-schema'],
  'packages/cli': ['packages/sdk'],
  'apps/collector': ['packages/core', 'packages/venues', 'packages/db'],
  'apps/api': ['packages/db', 'packages/api-schema'],
  'apps/dashboard': ['packages/api-schema', 'packages/core', 'packages/ui'],
};

// Packages with "private": true. A published package may not import them.
const privatePackages = ['packages/db', 'packages/ui', 'apps/collector', 'apps/api', 'apps/dashboard'];

const anyPackage = '^(packages|apps)/';
const oneOf = (paths: string[]): string => `^(${paths.join('|')})/`;

const directionRules: IForbiddenRuleType[] = Object.entries(allowed).map(([from, targets]) => ({
  name: `${from.replace('/', '-')}-direction`,
  comment: targets.length ? `${from} may only import ${targets.join(', ')}` : `${from} may not import other packages`,
  severity: 'error',
  from: { path: `^${from}/` },
  to: { path: anyPackage, pathNot: oneOf([from, ...targets]) },
}));

const config: IConfiguration = {
  forbidden: [
    ...directionRules,
    {
      name: 'unlisted-package',
      comment: 'Add the package to `allowed` in .dependency-cruiser.ts before it imports another package',
      severity: 'error',
      from: { path: '^((packages|apps)/[^/]+)/', pathNot: oneOf(Object.keys(allowed)) },
      to: { path: anyPackage, pathNot: '^$1/' },
    },
    {
      name: 'barrel-only',
      comment: 'Import another package through its barrel (for example @fair-fx/core), not a file inside it',
      severity: 'error',
      from: { path: '^((packages|apps)/[^/]+)/' },
      to: { path: anyPackage, pathNot: ['^$1/', '/index\\.ts$'] },
    },
    {
      name: 'published-no-private',
      comment: 'A package published to npm may not import a private package',
      severity: 'error',
      from: { path: anyPackage, pathNot: oneOf(privatePackages) },
      to: { path: oneOf(privatePackages) },
    },
    {
      name: 'core-node-builtins-only-in-node',
      comment: 'The main and stellar entries of core run in the browser. Put Node code under packages/core/src/node',
      severity: 'error',
      from: { path: '^packages/core/src/', pathNot: ['^packages/core/src/node/', '\\.test\\.ts$'] },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'core-stellar-sdk-only-in-stellar',
      comment: 'Only the stellar entry of core imports the Stellar SDK. Put that code under packages/core/src/stellar',
      severity: 'error',
      from: { path: '^packages/core/src/', pathNot: ['^packages/core/src/stellar/', '\\.test\\.ts$'] },
      to: { path: '/node_modules/@stellar/stellar-sdk/' },
    },
    {
      name: 'core-main-no-other-entry',
      comment: 'core main entry does no I/O: it imports neither the stellar entry nor the node entry',
      severity: 'error',
      from: {
        path: '^packages/core/src/',
        pathNot: ['^packages/core/src/(stellar|node|testing)/', '\\.test\\.ts$', '\\.factory\\.ts$'],
      },
      to: { path: '^packages/core/src/(stellar|node)/' },
    },
    {
      name: 'core-stellar-no-node-entry',
      comment: 'The stellar entry of core runs in the browser: it does not import the node entry',
      severity: 'error',
      from: { path: '^packages/core/src/stellar/', pathNot: '\\.test\\.ts$' },
      to: { path: '^packages/core/src/node/' },
    },
    {
      name: 'core-module-barrel-only',
      comment: 'Inside core, import a module folder (asset, pair, ...) through its index.ts',
      severity: 'error',
      from: { path: '^(packages/core/src/[^/]+)' },
      to: { path: '^packages/core/src/[^/]+/', pathNot: ['^$1/', '/index\\.ts$', '\\.factory\\.ts$'] },
    },
    {
      name: 'factories-only-in-tests',
      comment: 'Test factories (*.factory.ts, src/testing) are for test files and other factories only',
      severity: 'error',
      from: { path: '^(packages|apps)/', pathNot: ['\\.test\\.ts$', '\\.factory\\.ts$', '/src/testing/'] },
      to: { path: '(\\.factory\\.ts$|^(packages|apps)/[^/]+/src/testing/)' },
    },
    {
      name: 'types-no-schema',
      comment: 'A *.types.ts file holds plain TypeScript types: no zod, no *.schema.ts',
      severity: 'error',
      from: { path: '\\.types\\.ts$' },
      to: { path: ['\\.schema\\.ts$', '/node_modules/zod/'] },
    },
    {
      name: 'dashboard-core-main-only',
      comment: 'The dashboard reads the API over HTTP: of core it may only import the main entry',
      severity: 'error',
      from: { path: '^apps/dashboard/' },
      to: { path: '^packages/core/src/(stellar|node)/' },
    },
    {
      name: 'not-to-unresolvable',
      comment: 'The import does not resolve. Declare the package in package.json or fix the path',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(dist|coverage)/' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['@fair-fx/source', 'import', 'node', 'default'],
    },
  },
};

export default config;
