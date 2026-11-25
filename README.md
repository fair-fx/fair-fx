# fair-fx

FX execution check for stablecoin payments on Stellar.

## Setup

Needs Node 26 and pnpm 12 (Rust 1.99 later, for contracts).

```sh
pnpm install
pnpm check
```

`pnpm check` runs audit, lint, typecheck, unit tests and the dependency rules.

## Layout

```
packages/core       math, formatting, freshness (browser-safe), plus a Node-only entry
packages/venues     one quote adapter per venue
contracts/          Soroban contracts (empty for now)
```

Packages may only import in the allowed direction. The rules are in `.dependency-cruiser.cjs`
(`pnpm deps`) and `eslint.config.mjs` (`pnpm lint`).

## License

Apache-2.0
