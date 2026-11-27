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

Early. The collector can run once by hand; nothing starts it on a schedule yet.

| Part | What it does | State |
| --- | --- | --- |
| Venue quotes | Asks SDEX and the Classic AMM, Soroswap and Aquarius what a swap would pay | Built |
| Reference rate | Reads the fiat FX rate from the Reflector feed | Built |
| Rate math | Reference output, shortfall and the lowest output a limit allows, in integers | Built |
| Storage | Postgres schema and the write of one collector run | Built |
| Collector | Takes the quotes and the reference of one 5 minute slot and stores them as a run | Built, runs once by hand; no schedule yet |
| Guard | The `fx_guard` Soroban contract, which makes a swap fail past a limit | Not built |
| API, dashboard, SDK, CLI | How an app or a person reads the measurements | Not built |

## Try it with Docker only

Nothing to install but Docker. One command starts a Postgres server, applies the migrations, and does
one collector run on mainnet:

```sh
docker compose run --rm --build --quiet-build collector
```

- It prints one JSON line. `"outcome":"written"` means the run is stored, with 60 quotes when every
  venue answers. It reads mainnet only and sends no transaction.
- Run it again in the same 5 minute slot and it reports `slot_taken`: a slot is stored once.
- The first run downloads two images and builds a third, so it is the slow one. A later run reuses them.

Look at what was stored, then remove the server and its data:

```sh
docker compose exec postgres psql --username postgres --dbname fairfx \
  --command 'SELECT slot, reference_state, ledger FROM run ORDER BY slot' \
  --command 'SELECT venue, direction, amount_in, amount_out, shortfall_bps FROM quote_sample LIMIT 12'
docker compose down --volumes
```

- The server listens on `127.0.0.1:5433`, so `psql` or a database tool on this machine can read it at
  `postgres://postgres:local@127.0.0.1:5433/fairfx`. The password is for this throwaway server only.
- `--build` rebuilds the image when the code changed, so the run is always the code that is checked out.
- With pnpm installed, the same three steps are `pnpm local:collect`, `pnpm local:psql` and
  `pnpm local:down`.

## Setup

To work on the code: Node 26 and pnpm 12 (Rust 1.99 later, for contracts).

```sh
pnpm install
pnpm check
```

`pnpm check` runs audit, lint, typecheck, the dependency rules and the tests. CI runs the same on every
pull request, split into one job for the checks of the whole repo and one test job per package, next to
a scan for secrets and a build of the collector image. The tests of `packages/db` and `apps/collector`
start a Postgres server in a container, so Docker has to be running.

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
pnpm build                                     # compile every package to dist/, needed before pnpm collect
pnpm collect                                   # one collector run on mainnet, stored at DATABASE_URL
pnpm local:collect                             # the same run in Docker, with its own Postgres server
pnpm local:psql                                # psql in that server
pnpm local:down                                # remove that server and its data
```

Add `--reporter=verbose` to a test command to see each test by name. The smoke tests call public
third-party endpoints, so one failure can mean an endpoint is down: run them again before trusting it.
The `smoke` workflow runs them every night at 02:23 UTC, with one collector run on mainnet from the
image into a throwaway database.
[`packages/db/README.md`](packages/db/README.md) has the steps for a local database.

### One collector run

```sh
export DATABASE_URL=postgres://postgres:local@127.0.0.1:5433/fairfx   # a migrated database
pnpm build
pnpm collect
```

- It reads mainnet only and sends no transaction. It quotes every pair of `config/pairs.json` both
  ways at every venue, reads the reference prices, then the latest ledger, and stores one run.
- It prints one JSON line on standard output: the slot, the ledger's close time and how far it was
  from this machine's clock, the age of each price, and how each venue answered. A failure prints one
  `run_failed` line on standard error and exits with 1.
- A second run in the same 5 minute slot stores nothing and reports `slot_taken`, with exit code 0.
- `DATABASE_URL` can also go in a `.env` file at the repo root. `FAIRFX_NETWORK` (default `mainnet`)
  and `FAIRFX_CONFIG_DIR` (default the repo's `config/`) are optional.
- This machine's clock must be kept in time (NTP): a run whose clock is more than 30 seconds from the
  ledger's is stored as `unknown`.

### The collector image

```sh
docker build --platform linux/amd64 --file deploy/collector/Dockerfile --tag fairfx-collector .
docker run --rm -e DATABASE_URL=postgres://... fairfx-collector
```

- The image holds the compiled collector and `config/`, and does one run per start, like `pnpm collect`.
  It reads no `.env` file: the settings come from the container's environment.
- Build it from the repo root. `.dockerignore` lets in only the files it names.
- It does not apply migrations. Run `pnpm db:migrate` against the database first.

## Layout

```text
fair-fx/
├── compose.yaml             the collector and a Postgres server on this machine, with Docker only
├── config/                  networks, endpoints, contracts and pairs: code reads addresses from here
├── apps/
│   └── collector/           the worker, private: one run per start, `pnpm collect`
├── packages/
│   ├── core/                shared types and the rate math, no I/O in the main entry
│   │   ├── src/stellar/     entry that reads the network through the Stellar SDK: the reference and latest ledger readers
│   │   └── src/node/        Node-only entry: the config loader
│   ├── venues/              one quote adapter per venue: ok, no_route or error, with the cause
│   │   └── src/             sdex/, soroswap/, aquarius/
│   └── db/                  all Postgres access, private and not published
│       ├── migrations/      the schema, as SQL files
│       └── src/writes/      the write of one collector run
├── deploy/
│   └── collector/           the Dockerfile of the collector image
├── contracts/               Soroban contracts, an empty Cargo workspace for now
├── spec/
│   └── vectors/             rate math cases with expected results, for TypeScript and later Rust
├── tests/
│   └── fixtures/            answers recorded from the real venues, replayed by the unit tests
└── .github/
    └── workflows/           CI: repo checks, one test job per package, the collector image and a scan for secrets; a nightly smoke run
```

Packages may only import in the allowed direction: `venues` and `db` use `core`, and `core` uses
neither. The collector may use all three, and no package may use the collector. The rules are in
`.dependency-cruiser.ts` (`pnpm deps`).

## License

Apache-2.0
