# db

All Postgres access of FairFX: the migrations in `migrations/` and, in `src/writes`, what a collector
run writes. Nothing outside this package holds SQL.

A run is written once, when it has finished, with all its samples in one transaction. A slot is stored
whole or not at all, and a second write of a slot stores nothing.

## Tests

The tests run against a real Postgres server. They start one in a container
(`postgres:18.6-alpine`) and stop it when they end, so Docker has to be running. No database of yours
is touched.

```sh
pnpm --filter @fair-fx/db test                                     # all of them
pnpm --filter @fair-fx/db test write-run-slot                      # one file
pnpm --filter @fair-fx/db test write-run-slot --reporter=verbose   # with each test by name
```

The first run downloads the image. After that they take a few seconds.

## A local database

Start a server, apply the migrations, look at the tables, remove the server:

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

- `-d` runs the server in the background, and `--name` is how the later commands find it.
- `-p 127.0.0.1:5433:5432` opens it on port 5433 of this machine only. 5433 leaves 5432 free for a
  Postgres you may already run.
- `POSTGRES_PASSWORD=local` is for this throwaway server. The URL of a real database holds a real
  password: keep it out of the repo.
- The `until` line waits until the server accepts connections, which takes a second or two.
- `pnpm db:migrate` applies what the database does not have yet. A second run prints
  `No migrations to run!`. With no `DATABASE_URL` it stops and says so.
- `docker rm -f` removes the server and its data.

`pnpm db:migrate` works on any Postgres that `DATABASE_URL` points to.

## Adding a migration

- Add `migrations/0002_<what-it-does>.sql`, with the next number. The file starts with the line
  `-- Up Migration`.
- Never edit a migration that has been applied anywhere: the runner records each one by name and does
  not run it again.
- There are no down migrations. Measured data is kept, so a change is a new migration.
- Three `CHECK`s list the values of an enum in `@fair-fx/core`: direction, reference state and quote
  status. A value added to one of them needs a migration in the same pull request. For direction and
  reference state a test in `write-run-values.test.ts` fails until it has one. Quote status has no such
  test: a new status also needs a new case in `quote-row.ts`, so add the migration with it.
