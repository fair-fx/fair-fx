import { errorMessageWithCause, type QuoteError, QuoteErrorCause } from '@fair-fx/core';
import { errorQuote } from './error-quote.ts';
import { TIMEOUT_ERROR_NAME } from '../http/index.ts';

/**
 * The `error` quote for a `fetch` that rejected. `fetch` rejects with a `TypeError` when the request
 * cannot be made, and with the signal's `TimeoutError` when `AbortSignal.timeout` fires. Any other
 * `TypeError` thrown while the venue is asked is read as a network failure too.
 */
export function fetchFailure(failure: unknown, timeoutMs: number): QuoteError {
  if (failure instanceof Error && failure.name === TIMEOUT_ERROR_NAME) {
    return errorQuote(QuoteErrorCause.Timeout, `timed out after ${timeoutMs} ms`);
  }

  const cause = failure instanceof TypeError ? QuoteErrorCause.Network : QuoteErrorCause.Unknown;

  return errorQuote(cause, errorMessageWithCause(failure));
}
