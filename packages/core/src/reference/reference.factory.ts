import { REFERENCE_PRICE_DECIMALS } from './reference.schema.ts';
import type { FeedPrice, ReferenceFeed } from './reference.types.ts';

/**
 * `lastprice` of EUR as the mainnet feed returned it: 1.0953 USD with 14 decimals, set at
 * 2026-11-26 08:55:00 UTC in Unix seconds.
 */
export const EUR_FEED_PRICE: FeedPrice = { price: 109_531_321_156_430n, timestamp: 1_795_683_300n };

/** A feed that answers the expected decimals and `EUR_FEED_PRICE`, with `overrides` replacing either call. */
export function buildReferenceFeed(overrides: Partial<ReferenceFeed> = {}): ReferenceFeed {
  return {
    decimals: () => Promise.resolve(REFERENCE_PRICE_DECIMALS),
    lastPrice: () => Promise.resolve(EUR_FEED_PRICE),
    ...overrides,
  };
}
