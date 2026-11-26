import { QuoteStatus, type QuoteError } from '@fair-fx/core';

export function errorQuote(reason: string): QuoteError {
  return { status: QuoteStatus.Error, reason };
}
