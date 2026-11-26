# FairFX: how to run and test

Work delivered on 2026-11-25 and 2026-11-26. The output below was recorded on 2026-11-26 from the `dev`
branch. Counts grow as tests are added, and times differ from one machine to the next.

This guide is on the branch `wip/run-and-test-guide`. The code on that branch is the code of `dev`: the
branch adds only the files in `docs/` and the links to them in the README.

Two more files go with this guide, for reading without running anything:

- [`test-output.md`](test-output.md): every test, by name, with its result.
- [`venue-adapters.md`](venue-adapters.md): what each venue is asked, what it answers, and how each kind
  of answer is handled.

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

Needs Node 26 or later, pnpm 12 and Docker.

```sh
git clone --branch wip/run-and-test-guide https://github.com/fair-fx/fair-fx.git
cd fair-fx
pnpm install
```

- `--branch wip/run-and-test-guide` checks out the branch that holds this guide. Without it you get
  `dev`: the same code, without `docs/`.
- Docker has to be running for steps 3 and 6. The database tests start a Postgres server in a container
  and remove it when they end.

## 3. Run every check

```sh
pnpm check
```

Runs the dependency audit, lint, typecheck, dependency rules and the tests. It takes well under a
minute once the Postgres image is downloaded, and ends with exit code 0. The lines to look for (`...`
stands for lines left out):

```text
2 vulnerabilities found
Severity: 2 moderate
...
✔ no dependency violations found (172 modules, 404 dependencies cruised)
...
packages/core test:  Test Files  11 passed | 1 skipped (12)
packages/core test:       Tests  136 passed | 2 skipped (138)
...
packages/venues test:  Test Files  9 passed | 3 skipped (12)
packages/venues test:       Tests  78 passed | 3 skipped (81)
...
packages/db test:  Test Files  4 passed (4)
packages/db test:       Tests  18 passed (18)
```

- The two moderate advisories are in `glob` and `minimatch`, which two dependencies pull in. The check
  stops at severity high or above, so it passes.
- The skipped tests are the live ones in step 4.
- The core and venues tests need no network: they replay answers recorded from the real venues, kept
  in `tests/fixtures/`.
- The db tests run against a real Postgres. Their first run downloads the Postgres image.

## 4. Run against live mainnet

```sh
pnpm test:smoke --reporter=verbose
```

Read-only. No keys, no funds, no transactions. Output:

```text
 ✓ src/node/reference-reader.smoke.test.ts > the live Reflector fiat feed > holds a plausible EUR price on mainnet, at the addresses in config/ 583ms
 ✓ src/node/reference-reader.smoke.test.ts > the live Reflector fiat feed > holds a plausible EUR price on testnet 1022ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
...
 ✓ src/soroswap/soroswap.smoke.test.ts > the live Soroswap router > quotes 100 USDC to EURC on mainnet, at the addresses in config/ 471ms
 ✓ src/aquarius/aquarius.smoke.test.ts > the live Aquarius API > quotes 100 USDC to EURC on mainnet, at the addresses in config/ 997ms
 ✓ src/sdex/sdex.smoke.test.ts > the live Horizon > quotes 100 USDC to EURC on mainnet, at the addresses in config/ 1353ms

 Test Files  3 passed (3)
      Tests  3 passed (3)
```

- The Reflector fiat feed returns a plausible EUR price on mainnet and on testnet.
- SDEX + Classic AMM, Soroswap and Aquarius each quote 100 USDC to EURC on mainnet, and the quote is
  between 50 and 200 EURC.

These call public third-party endpoints (Horizon, a public Soroban RPC node, the Aquarius API). A
failure here can mean one of them is down. Run it again before reporting it.

## 5. Run one area

Add `--reporter=verbose` to any command in the table to see each test by name, for example:

```sh
pnpm --filter @fair-fx/db test --reporter=verbose
```

```text
 ✓ src/migrate/migrate.test.ts > migrate > creates the tables of a run and its samples in an empty database 149ms
 ✓ src/migrate/migrate.test.ts > migrate > applies nothing to a database that has every migration 55ms
 ✓ src/writes/write-run.test.ts > writeRun > stores a run with its reference and a quote of each status 116ms
 ✓ src/writes/write-run-slot.test.ts > writeRun, one run per slot > stores nothing and says the slot is taken when a run of the slot is stored already 121ms
 ✓ src/writes/write-run-slot.test.ts > writeRun, one run per slot > waits for a run that is writing the same slot, then says the slot is taken 79ms
 ✓ src/writes/write-run-slot.test.ts > writeRun, one run per slot > stores nothing of a run when the database refuses one of its rows 65ms
...
 Test Files  4 passed (4)
      Tests  18 passed (18)
```

Each line is one behaviour. The other packages read the same way.

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

Output (`...` stands for the SQL of the migration, which is printed in full):

```text
127.0.0.1:5432 - no response
127.0.0.1:5432 - accepting connections
> Migrating files:
> - 0001_run-and-samples
### MIGRATION 0001_run-and-samples (UP) ###
...
Migrations complete!
                List of tables
 Schema |       Name       | Type  |  Owner
--------+------------------+-------+----------
 public | pgmigrations     | table | postgres
 public | quote_sample     | table | postgres
 public | reference_sample | table | postgres
 public | run              | table | postgres
(4 rows)
```

- After the list comes the description of `quote_sample`: its columns, indexes and constraints.
- `pgmigrations` is where the migration tool records what it applied. A second `pnpm db:migrate`
  prints `No migrations to run!`.
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
