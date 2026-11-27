import { QuoteStatus } from '@fair-fx/core';
import type { QuoteSample } from '@fair-fx/db/writes';
import type { ReferenceSet, TakenQuote } from './quotes.types.ts';
import { quoteShortfall } from './shortfall.ts';

/**
 * The sample a taken quote is stored as. Only an `ok` quote has a shortfall. `references` is `null`
 * when the run has no reference it can compare a quote with, and then no quote has one.
 */
export function toQuoteSample(taken: TakenQuote, references: ReferenceSet | null): QuoteSample {
  const { quote } = taken;
  const request = {
    pair: taken.pair.id,
    direction: taken.direction,
    venue: taken.venue,
    amountIn: taken.amountIn,
    quotedAt: taken.quotedAt,
  };
  if (quote.status !== QuoteStatus.Ok) {
    return { ...request, quote };
  }

  const shortfall = references === null ? null : quoteShortfall(taken, quote.amountOut, references);

  return { ...request, quote, shortfall };
}
