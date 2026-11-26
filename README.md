# fair-fx

FX execution check for stablecoin payments on Stellar.

## Setup

Needs Node 26 and pnpm 12 (Rust 1.99 later, for contracts).

```sh
pnpm install
pnpm check
```

`pnpm check` runs audit, lint, typecheck, the dependency rules and the tests. CI runs it on every pull
request, next to a scan for secrets. The tests of `packages/db` start a Postgres server in a container,
so Docker has to be running.

## Commands

Run from the repo root.

```sh
pnpm check                                     # audit, then lint, typecheck, deps and test
pnpm lint                                      # ESLint
pnpm typecheck                                 # tsc on every package
pnpm deps                                      # which package may import which
pnpm test                                      # the tests of every package
pnpm --filter @fair-fx/venues test             # the tests of one package
pnpm --filter @fair-fx/venues test aquarius    # only the test files with "aquarius" in their name
pnpm test:smoke                                # live read-only calls to mainnet and testnet
pnpm db:migrate                                # apply the migrations to the database at DATABASE_URL
```

Add `--reporter=verbose` to a test command to see each test by name. The smoke tests call public
third-party endpoints, so one failure can mean an endpoint is down: run them again before trusting it.
[`packages/db/README.md`](packages/db/README.md) has the steps for a local database.

## Layout

```
config/             networks and pinned pairs, read by @fair-fx/core/node
packages/core       math, formatting, freshness (browser-safe), a Node-only entry, test factories
packages/venues     one quote adapter per venue
packages/db         Postgres: the migrations and what a collector run writes (private)
contracts/          Soroban contracts (empty for now)
spec/vectors/       rate math cases, read by the TypeScript tests and later by the Rust tests
```

Packages may only import in the allowed direction. The rules are in `.dependency-cruiser.ts`
(`pnpm deps`).

## License

Apache-2.0
