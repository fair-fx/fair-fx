import { type QuoteError, type QuoteErrorCause, QuoteStatus } from '@fair-fx/core';

export function errorQuote(cause: QuoteErrorCause, reason: string): QuoteError {
  return { status: QuoteStatus.Error, cause, reason };
}
