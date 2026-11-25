// Which package may import which other package. A package not listed here may import none.
const allowed = {
  'packages/core': [],
  'packages/venues': ['packages/core'],
  'packages/db': ['packages/core'],
  'packages/api-schema': ['packages/core'],
  'packages/ui': [],
  'packages/sdk': ['packages/venues', 'packages/api-schema'],
  'packages/cli': ['packages/sdk'],
  'apps/collector': ['packages/venues', 'packages/db'],
  'apps/api': ['packages/db', 'packages/api-schema'],
  'apps/dashboard': ['packages/api-schema', 'packages/core', 'packages/ui'],
};

const anyPackage = '^(packages|apps)/';
const known = Object.keys(allowed).join('|');

const directionRules = Object.entries(allowed).map(([from, targets]) => ({
  name: `${from.replace('/', '-')}-direction`,
  comment: targets.length ? `${from} may only import ${targets.join(', ')}` : `${from} may not import other packages`,
  severity: 'error',
  from: { path: `^${from}/` },
  to: { path: anyPackage, pathNot: `^(${[from, ...targets].join('|')})/` },
}));

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    ...directionRules,
    {
      name: 'unlisted-package',
      comment: 'Add the package to `allowed` in .dependency-cruiser.cjs before it imports another package',
      severity: 'error',
      from: { path: '^((packages|apps)/[^/]+)/', pathNot: `^(${known})/` },
      to: { path: anyPackage, pathNot: '^$1/' },
    },
    {
      name: 'core-main-no-node',
      comment: 'core main entry runs in the browser. Put Node code under packages/core/src/node',
      severity: 'error',
      from: { path: '^packages/core/src/', pathNot: ['^packages/core/src/node/', '\\.test\\.ts$'] },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'dashboard-no-core-node',
      comment: 'The dashboard may only import the browser entry of core',
      severity: 'error',
      from: { path: '^apps/dashboard/' },
      to: { path: '^packages/core/src/node/' },
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
    exclude: { path: '(^|/)(dist|coverage|\\.nx)/' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['@fairfx/source', 'import', 'node', 'default'],
    },
  },
};
