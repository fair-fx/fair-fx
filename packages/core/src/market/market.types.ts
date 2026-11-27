/**
 * A span of every week, in seconds since Monday 00:00 UTC. `start` is inside the span and `end` is
 * not. A span with `start` after `end` runs over the end of the week. The same shape and rule as the
 * closed window of an `fx_guard` policy.
 */
export interface WeeklyWindow {
  readonly start: number;
  readonly end: number;
}

/** When the FX market is taken to be closed. */
export interface MarketHours {
  /** `null` for a market with no closed hours. */
  readonly closedWindow: WeeklyWindow | null;
}
