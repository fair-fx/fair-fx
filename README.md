# fairfx

Code for FairFX, an FX execution check for stablecoin payments on Stellar. Design, decisions and
delivery plans live in the TDD repo, not here.

Status: repo skeleton (S1). Only `packages/core` and `packages/venues` exist, as stubs.

## Requirements

- Node 26 (`.node-version`)
- pnpm 12.23.0 (pinned in `package.json` `packageManager`; pnpm 11+ switches to it on its own)
- Rust 1.99.1 (`rust-toolchain.toml`), used from Sprint 1 week 2

## Commands

```sh
pnpm install --frozen-lockfile
pnpm lint               # ESLint per package, includes the boundary rule
pnpm typecheck          # tsc per package
pnpm test               # vitest per package
pnpm check:boundaries   # boundary canary: forbidden imports must fail, allowed ones must pass
pnpm check              # everything CI runs
```

CI also scans the full git history for secrets with gitleaks (`.gitleaks.toml`, which adds a rule
for Stellar secret seeds). Run it locally with `gitleaks git --config .gitleaks.toml .`.

Tasks run through Nx (`nx run-many`). There is no Nx Cloud; the cache is local.

## Layout

```
packages/core      @fairfx/core       pairs, math, formatting, freshness (no I/O); /node entry for Node readers
packages/venues    @fairfx/venues     one quote adapter per venue
contracts/         Cargo workspace, empty until fx-guard
scripts/           repo scripts (boundary canary)
```

Other packages and apps are created in the step that first needs them. The full target layout is
in the TDD, `docs/architecture.md` §8.

## Dependency rules

Every package carries tags in its `package.json` under `nx.tags`. `eslint.config.mjs` turns the
dependency direction of `docs/architecture.md` §1 into `@nx/enforce-module-boundaries` constraints,
so a forbidden import fails lint. `scripts/check-boundaries.mjs` proves the rules bite.

Packages resolve each other from source through the `@fairfx/source` export condition, so lint,
typecheck and test need no prior build. `dist/` is only for publishing.

## License

Apache-2.0. See [LICENSE](LICENSE).
