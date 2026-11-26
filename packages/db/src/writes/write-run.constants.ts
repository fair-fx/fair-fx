/** Inserts the run unless its slot is stored already. Returns the new row's id, or no row. */
export const INSERT_RUN_SQL = `
  INSERT INTO run (slot, started_at, finished_at, ledger, reference_state)
  VALUES ($1, $2, $3, $4, $5)
  ON CONFLICT (slot) DO NOTHING
  RETURNING id`;

/** Inserts the reference samples of run `$1` from `$2`, a JSON array of rows keyed by column name. */
export const INSERT_REFERENCE_SAMPLES_SQL = `
  INSERT INTO reference_sample (run_id, source, symbol, status, price, decimals, oracle_time, reason)
  SELECT $1, source, symbol, status, price, decimals, oracle_time, reason
  FROM jsonb_to_recordset($2::jsonb) AS sample (
    source TEXT, symbol TEXT, status TEXT, price NUMERIC, decimals SMALLINT, oracle_time TIMESTAMPTZ, reason TEXT
  )`;

/** Inserts the quote samples of run `$1` from `$2`, a JSON array of rows keyed by column name. */
export const INSERT_QUOTE_SAMPLES_SQL = `
  INSERT INTO quote_sample (
    run_id, pair, direction, venue, amount_in, amount_out, shortfall_bps, shortfall_source,
    route, status, cause, reason, ledger, quoted_at
  )
  SELECT
    $1, pair, direction, venue, amount_in, amount_out, shortfall_bps, shortfall_source,
    route, status, cause, reason, ledger, quoted_at
  FROM jsonb_to_recordset($2::jsonb) AS sample (
    pair TEXT, direction TEXT, venue TEXT, amount_in NUMERIC, amount_out NUMERIC, shortfall_bps INTEGER,
    shortfall_source TEXT, route JSONB, status TEXT, cause TEXT, reason TEXT, ledger BIGINT,
    quoted_at TIMESTAMPTZ
  )`;
