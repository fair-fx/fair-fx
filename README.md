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
config/             networks and pinned pairs, read by @fair-fx/core/node
packages/core       math, formatting, freshness (browser-safe), a Node-only entry, test factories
packages/venues     one quote adapter per venue
contracts/          Soroban contracts (empty for now)
spec/vectors/       rate math cases, read by the TypeScript tests and later by the Rust tests
```

Packages may only import in the allowed direction. The rules are in `.dependency-cruiser.ts`
(`pnpm deps`).

## License

Apache-2.0
