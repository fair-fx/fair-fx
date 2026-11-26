import type { Quote } from '@fair-fx/core';
import { errorQuote } from './error-quote.ts';
import { failureReason } from './failure-reason.ts';

/**
 * Asks a venue for a quote without ever throwing. An amount of zero or less is refused before the
 * venue is asked. A request that fails or takes longer than `timeoutMs` comes back as an `error` quote.
 */
export async function quoteOrError<Route>(
  amountIn: bigint,
  timeoutMs: number,
  askVenue: () => Promise<Quote<Route>>,
): Promise<Quote<Route>> {
  if (amountIn <= 0n) {
    return errorQuote(`expected an amount in above zero, got ${amountIn}`);
  }

  try {
    return await askVenue();
  } catch (error) {
    return errorQuote(failureReason(error, timeoutMs));
  }
}
