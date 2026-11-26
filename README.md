# fair-fx

FX execution check for stablecoin payments on Stellar.

## What it is

A payment app that converts USDC to EURC gets the rate of whatever liquidity sits in one pool or order
book at that moment. That is not the foreign exchange rate, and neither the app nor its user sees the
difference. FairFX measures it, so the app can answer three questions:

1. How far is each Stellar venue from the FX rate, for this amount, right now?
2. What is the largest amount I can swap and stay inside my limit?
3. Can the swap fail by itself when the rate is worse than my limit?

It does so by asking each venue what a swap would pay (a quote), reading the FX rate from an oracle (the
reference), and expressing the gap in basis points (the shortfall).

## Status

Early. There is no app to start yet: what exists is libraries and their tests.

| Part | What it does | State |
| --- | --- | --- |
| Venue quotes | Asks SDEX and the Classic AMM, Soroswap and Aquarius what a swap would pay | Built |
| Reference rate | Reads the fiat FX rate from the Reflector feed | Built |
| Rate math | Reference output, shortfall and the lowest output a limit allows, in integers | Built |
| Storage | Postgres schema and the write of one collector run | Built |
| Collector | Takes quotes and the reference on a schedule and stores them | Not built |
| Guard | The `fx_guard` Soroban contract, which makes a swap fail past a limit | Not built |
| API, dashboard, SDK, CLI | How an app or a person reads the measurements | Not built |

- [`docs/how-to-run-and-test.md`](docs/how-to-run-and-test.md): how to check what is built, with the
  output to expect.
- [`docs/venue-adapters.md`](docs/venue-adapters.md): what each venue is asked, what it answers, and how
  each kind of answer is handled.

## Setup

Needs Node 26 and pnpm 12 (Rust 1.99 later, for contracts).

```sh
pnpm install
pnpm check
```

`pnpm check` runs audit, lint, typecheck, the dependency rules and the tests. CI runs the same on every
pull request, split into one job for the checks of the whole repo and one test job per package, next to
a scan for secrets. The tests of `packages/db` start a Postgres server in a container, so Docker has to
be running.

## Commands

Run from the repo root.

```sh
pnpm check                                     # check:repo, then test
pnpm check:repo                                # audit, lint, typecheck and deps: no tests
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

```text
fair-fx/
├── config/                  networks, endpoints, contracts and pairs: code reads addresses from here
├── packages/
│   ├── core/                shared types and the rate math, no I/O in the main entry
│   │   └── src/node/        Node-only entry: the config loader and the reference reader
│   ├── venues/              one quote adapter per venue: ok, no_route or error, with the cause
│   │   └── src/             sdex/, soroswap/, aquarius/
│   └── db/                  all Postgres access, private and not published
│       ├── migrations/      the schema, as SQL files
│       └── src/writes/      the write of one collector run
├── contracts/               Soroban contracts, an empty Cargo workspace for now
├── spec/
│   └── vectors/             rate math cases with expected results, for TypeScript and later Rust
├── tests/
│   └── fixtures/            answers recorded from the real venues, replayed by the unit tests
├── docs/                    the guide to run and test, its recorded output, adapter input and output
└── .github/
    └── workflows/           CI: repo checks, one test job per package and a scan for secrets
```

Packages may only import in the allowed direction: `venues` and `db` use `core`, and `core` uses
neither. The rules are in `.dependency-cruiser.ts` (`pnpm deps`).

## License

Apache-2.0
