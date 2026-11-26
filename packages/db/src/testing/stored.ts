import type { Database } from '../database/index.ts';

/** Every row of the three measured tables as the driver returns it, without the generated run id. */
export interface Stored {
  readonly runs: readonly unknown[];
  readonly references: readonly unknown[];
  readonly quotes: readonly unknown[];
}

/** Reads everything a database holds of runs and samples, in a fixed order. */
export async function readStored(database: Database): Promise<Stored> {
  const runs = await database.query(
    'SELECT slot, started_at, finished_at, ledger, reference_state FROM run ORDER BY slot',
  );
  const references = await database.query(
    `SELECT source, symbol, status, price, decimals, oracle_time, reason
     FROM reference_sample ORDER BY run_id, source, symbol`,
  );
  const quotes = await database.query(
    `SELECT pair, direction, venue, amount_in, amount_out, shortfall_bps, shortfall_source, route, status,
            cause, reason, ledger, quoted_at
     FROM quote_sample ORDER BY run_id, pair, direction, venue, amount_in`,
  );

  return { runs: runs.rows, references: references.rows, quotes: quotes.rows };
}

/** The names of the tables in the `public` schema, sorted. */
export async function tableNames(database: Database): Promise<readonly string[]> {
  const tables = await database.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  );

  return tables.rows.map((table) => table.tablename);
}
