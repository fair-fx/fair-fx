import type { Direction, Pair, VenueAdapter } from '@fair-fx/core';
import type { TakenQuote } from '../quotes/index.ts';

/**
 * Asks `venue` for a quote of `pair` in `direction` for each of `amounts`, one after the other, so
 * one ladder never has more than one request open at a venue. Each quote is dated when it arrives.
 */
export async function takeLadder(
  venue: VenueAdapter,
  pair: Pair,
  direction: Direction,
  amounts: readonly bigint[],
  now: () => Date,
): Promise<TakenQuote[]> {
  const taken: TakenQuote[] = [];
  for (const amountIn of amounts) {
    const quote = await venue.quote(pair, direction, amountIn);
    taken.push({ pair, direction, venue: venue.id, amountIn, quotedAt: now(), quote });
  }

  return taken;
}
