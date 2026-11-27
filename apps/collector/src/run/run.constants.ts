export const MILLISECONDS_PER_SECOND = 1000;

/** A run is stored under the 5 minute slot it started in. */
export const SLOT_MILLISECONDS = 300_000;

/**
 * How far the close time of the latest ledger and the collector's own clock may be apart. Past it,
 * the node lags or one of the two clocks is wrong, and the run cannot say how old a price is.
 *
 * 30 seconds is also how old the latest ledger of a `stellar-rpc` node may be before its own health
 * check fails, by default (`max-healthy-ledger-latency`).
 */
export const MAX_CLOCK_SKEW_SECONDS = 30;
