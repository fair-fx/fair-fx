import { QuoteStatus } from '@fair-fx/core';
import type { QuoteSample } from '@fair-fx/db/writes';
import type { QuoteTally } from './log.types.ts';

/** How many of `quotes` ended each way, per venue. */
export function quoteTally(quotes: readonly QuoteSample[]): QuoteTally {
  const tally: Record<string, Record<string, number>> = {};
  for (const { venue, quote } of quotes) {
    const outcome = quote.status === QuoteStatus.Ok ? quote.status : `${quote.status}:${quote.cause}`;
    const counts = (tally[venue] ??= {});
    counts[outcome] = (counts[outcome] ?? 0) + 1;
  }

  return tally;
}
