import { type Quote, type QuoteError, QuoteErrorCause } from '@fair-fx/core';
import { errorQuote } from './error-quote.ts';

/**
 * Asks a venue for a quote without ever throwing. An amount of zero or less is refused before the
 * venue is asked. When `askVenue` rejects, `toError` says which kind of failure that was.
 */
export async function quoteOrError<Route>(
  amountIn: bigint,
  toError: (failure: unknown) => QuoteError,
  askVenue: () => Promise<Quote<Route>>,
): Promise<Quote<Route>> {
  if (amountIn <= 0n) {
    return errorQuote(QuoteErrorCause.BadRequest, `expected an amount in above zero, got ${amountIn}`);
  }

  try {
    return await askVenue();
  } catch (failure) {
    return toError(failure);
  }
}
