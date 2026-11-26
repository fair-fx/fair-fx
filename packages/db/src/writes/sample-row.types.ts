/** One `reference_sample` row without its `run_id`, keyed by column name. Numbers too large for JSON are text. */
export interface ReferenceRow {
  readonly source: string;
  readonly symbol: string;
  readonly status: string;
  readonly price: string | null;
  readonly decimals: number | null;
  /** ISO 8601. */
  readonly oracle_time: string | null;
  readonly reason: string | null;
}

/** One `quote_sample` row without its `run_id`, keyed by column name. Numbers too large for JSON are text. */
export interface QuoteRow {
  readonly pair: string;
  readonly direction: string;
  readonly venue: string;
  readonly amount_in: string;
  readonly amount_out: string | null;
  readonly shortfall_bps: string | null;
  readonly shortfall_source: string | null;
  readonly route: unknown;
  readonly status: string;
  readonly cause: string | null;
  readonly reason: string | null;
  readonly ledger: number | null;
  /** ISO 8601. */
  readonly quoted_at: string;
}
