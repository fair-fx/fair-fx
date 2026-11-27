import { QuoteStatus, type VenueId } from '@fair-fx/core';
import type { QuoteSample } from '@fair-fx/db/writes';
import type { QuoteTally } from './log.types.ts';

/** How many of `quotes` ended each way, per venue. */
export function quoteTally(quotes: readonly QuoteSample[]): QuoteTally {
  const tally = new Map<VenueId, Map<string, number>>();
  for (const { venue, quote } of quotes) {
    const outcome = quote.status === QuoteStatus.Ok ? quote.status : `${quote.status}:${quote.cause}`;
    const counts = tally.get(venue) ?? new Map<string, number>();
    counts.set(outcome, (counts.get(outcome) ?? 0) + 1);
    tally.set(venue, counts);
  }

  return Object.fromEntries([...tally].map(([venue, counts]) => [venue, Object.fromEntries(counts)]));
}
