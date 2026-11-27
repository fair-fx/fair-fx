import type { Pair, VenueAdapter } from '@fair-fx/core';
import { ladderAmounts, type TakenQuote } from '../quotes/index.ts';
import { DIRECTIONS } from './collect.constants.ts';
import { takeLadder } from './take-ladder.ts';

/**
 * Takes the whole ladder of every pair, both ways, at every venue. The ladders run at the same time,
 * so a venue that is slow to answer does not hold up the others; inside a ladder the rungs go one at
 * a time. The quotes come back ordered by venue, pair, direction and rung.
 */
export async function takeQuotes(
  venues: readonly VenueAdapter[],
  pairs: readonly Pair[],
  ladder: readonly bigint[],
  now: () => Date,
): Promise<TakenQuote[]> {
  const ladders = venues.flatMap((venue) =>
    pairs.flatMap((pair) =>
      DIRECTIONS.map((direction) => takeLadder(venue, pair, direction, ladderAmounts(ladder, pair, direction), now)),
    ),
  );

  return (await Promise.all(ladders)).flat();
}
