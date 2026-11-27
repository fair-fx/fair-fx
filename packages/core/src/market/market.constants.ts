import type { MarketHours } from './market.types.ts';

export const SECONDS_PER_WEEK = 604_800;

/** Unix time starts on a Thursday. Adding 3 days makes Monday 00:00 UTC the zero of the week. */
export const UNIX_EPOCH_SECONDS_AFTER_MONDAY = 259_200;

/**
 * Friday 22:00 to Sunday 22:00 UTC. A first guess, not checked against a source, so a run marked
 * `closed` means "inside this window", not a measured fact about the market.
 *
 * It is fixed in UTC: 22:00 UTC is 17:00 in New York on standard time, and the window does not move
 * to 21:00 UTC when New York is on daylight time. Over one weekend of the mainnet feed, 2026-11-20
 * to 2026-11-23, the EUR price went quiet from about Friday 18:20 UTC and moved as on a weekday
 * again from Sunday 21:05 UTC.
 */
export const DEFAULT_MARKET_HOURS: MarketHours = { closedWindow: { start: 424_800, end: 597_600 } };
