# FairFX: how to run and test

Work delivered on 2026-11-25 and 2026-11-26. The test counts below are those of the `dev` branch on
2026-11-26 and grow as tests are added.

## 1. What you are testing

There is no app, CLI or API yet. The work so far is three TypeScript packages. You check them through
their test suites, through live read-only calls to Stellar mainnet, and through a Postgres database you
start on your own machine.

| Delivered | Pull requests | Check with |
| --- | --- | --- |
| Repo setup, lint, dependency rules, CI | [#3], [#8], [#9], [#12] | `pnpm check` |
| Config files and loader with pinned assets | [#5], [#14] | `pnpm --filter @fair-fx/core test config pinned network` |
| Rate math and shared test vectors | [#7] | `pnpm --filter @fair-fx/core test rate` |
| Reference rate reader (Reflector fiat feed) | [#10] | `pnpm --filter @fair-fx/core test reference` |
| SDEX + Classic AMM quotes (Horizon) | [#11] | `pnpm --filter @fair-fx/venues test sdex` |
| Soroswap quotes (router simulation) | [#13] | `pnpm --filter @fair-fx/venues test soroswap` |
| Aquarius quotes (find-path API) | [#15], [#18] | `pnpm --filter @fair-fx/venues test aquarius` |
| A failed quote says why: causes for `no_route` and `error` | [#16], [#17] | the three venue commands above |
| Postgres schema and the write of one collector run | [#20] | `pnpm --filter @fair-fx/db test` |

## 2. Setup

```sh
git clone https://github.com/fair-fx/fair-fx.git
cd fair-fx
pnpm install
```

Docker has to be running for steps 3 and 6. The database tests start a Postgres server in a container
and remove it when they end.

## 3. Run every check

```sh
pnpm check
```

Runs the dependency audit, lint, typecheck, dependency rules and the tests. Expected:

- `no dependency violations found`
- core: 136 passed, 2 skipped
- venues: 78 passed, 3 skipped
- db: 18 passed

The skipped tests are the live ones in step 4. The core and venues tests need no network: they replay
answers recorded from the real venues, kept in `tests/fixtures/`. The db tests run against a real
Postgres. Their first run downloads the Postgres image, after that they take a few seconds.

## 4. Run against live mainnet

```sh
pnpm test:smoke --reporter=verbose
```

Read-only. No keys, no funds, no transactions. Expected: 2 passed in core, 3 passed in venues.

- The Reflector fiat feed returns a plausible EUR price on mainnet and on testnet.
- SDEX + Classic AMM, Soroswap and Aquarius each quote 100 USDC to EURC on mainnet, and the quote is
  between 50 and 200 EURC.

These call public third-party endpoints (Horizon, a public Soroban RPC node, the Aquarius API). A
failure here can mean one of them is down. Run it again before reporting it.

## 5. Run one area

Add `--reporter=verbose` to any command in the table to see each test by name, for example:

```sh
pnpm --filter @fair-fx/venues test aquarius --reporter=verbose
```

## 6. Look at the database

Start a throwaway Postgres, create the tables in it, list them, then remove it:

```sh
docker run -d --name fairfx-postgres \
  -e POSTGRES_PASSWORD=local -e POSTGRES_DB=fairfx \
  -p 127.0.0.1:5433:5432 postgres:18.6-alpine
until docker exec fairfx-postgres pg_isready -h 127.0.0.1 -U postgres -d fairfx; do sleep 1; done

export DATABASE_URL=postgres://postgres:local@127.0.0.1:5433/fairfx
pnpm db:migrate

docker exec fairfx-postgres psql -U postgres -d fairfx -c '\dt' -c '\d quote_sample'

docker rm -f fairfx-postgres
```

Expected:

- `pnpm db:migrate` ends with `Migrations complete!`. A second run prints `No migrations to run!`.
- `\dt` lists four tables: `run`, `reference_sample`, `quote_sample`, and `pgmigrations`, where the
  migration tool records what it applied.
- The tables are empty. Nothing collects quotes on a schedule yet, so the write of a run is shown by
  the db tests in step 3 and not by rows here.

The `until` line waits for the server, which takes a second or two to start.
[`packages/db/README.md`](../packages/db/README.md) explains each flag.

## 7. Limits

- A quote is what a venue says it would pay, not an executed trade.
- The live tests only check that a quote is in a plausible range. They do not print it.
- The database part is the schema and the write of one run. Nothing calls that write yet.
- Not built yet: the collector, the API, the dashboard, the CLI and the `fx_guard` contract.

[#3]: https://github.com/fair-fx/fair-fx/pull/3
[#5]: https://github.com/fair-fx/fair-fx/pull/5
[#7]: https://github.com/fair-fx/fair-fx/pull/7
[#8]: https://github.com/fair-fx/fair-fx/pull/8
[#9]: https://github.com/fair-fx/fair-fx/pull/9
[#10]: https://github.com/fair-fx/fair-fx/pull/10
[#11]: https://github.com/fair-fx/fair-fx/pull/11
[#12]: https://github.com/fair-fx/fair-fx/pull/12
[#13]: https://github.com/fair-fx/fair-fx/pull/13
[#14]: https://github.com/fair-fx/fair-fx/pull/14
[#15]: https://github.com/fair-fx/fair-fx/pull/15
[#16]: https://github.com/fair-fx/fair-fx/pull/16
[#17]: https://github.com/fair-fx/fair-fx/pull/17
[#18]: https://github.com/fair-fx/fair-fx/pull/18
[#20]: https://github.com/fair-fx/fair-fx/pull/20
