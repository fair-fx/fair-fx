import type { MarketHours } from './market.types.ts';

export const SECONDS_PER_WEEK = 604_800;

/** Unix time starts on a Thursday. Adding 3 days makes Monday 00:00 UTC the zero of the week. */
export const UNIX_EPOCH_SECONDS_AFTER_MONDAY = 259_200;

/**
 * Friday 21:00 to Sunday 22:00 UTC, all year.
 *
 * FX is taken to be closed from Friday 17:00 to Sunday 17:00 in New York. That is 21:00 UTC on
 * daylight time and 22:00 UTC on standard time, and this window covers both. So it stays fixed in
 * UTC, and a guard policy, which is designed to read the ledger's UTC clock, can hold the same
 * window. The cost is one hour a week that counts as closed while New York is open: the last hour of
 * Friday on standard time, the first hour of Sunday on daylight time.
 *
 * A first guess. The New York hours are the ones trading platforms publish, and nothing shows that
 * the feed follows them, so a run marked `closed` means "inside this window", not a measured fact
 * about the market. Holidays are not in it. Over one weekend of the mainnet feed, 2026-11-20 to
 * 2026-11-23, on standard time, the EUR price went quiet from about Friday 18:20 UTC and moved as on
 * a weekday again from Sunday 21:05 UTC.
 */
export const DEFAULT_MARKET_HOURS: MarketHours = { closedWindow: { start: 421_200, end: 597_600 } };
