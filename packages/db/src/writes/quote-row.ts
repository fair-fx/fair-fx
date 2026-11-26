import { QuoteStatus } from '@fair-fx/core';
import type { QuoteSample } from './run.types.ts';
import type { QuoteRow } from './sample-row.types.ts';

/** The row a quote sample is stored as. Only an `ok` quote has an amount, a route and a shortfall. */
export function toQuoteRow(sample: QuoteSample): QuoteRow {
  const { quote } = sample;
  const shortfall = 'shortfall' in sample ? sample.shortfall : null;
  const row = {
    pair: sample.pair,
    direction: sample.direction,
    venue: sample.venue,
    amount_in: sample.amountIn.toString(),
    status: quote.status,
    quoted_at: sample.quotedAt.toISOString(),
  };
  const unpriced = { amount_out: null, shortfall_bps: null, shortfall_source: null, route: null, ledger: null };

  switch (quote.status) {
    case QuoteStatus.Ok:
      return {
        ...row,
        amount_out: quote.amountOut.toString(),
        shortfall_bps: shortfall === null ? null : shortfall.bps.toString(),
        shortfall_source: shortfall === null ? null : shortfall.source,
        route: quote.route,
        cause: null,
        reason: null,
        ledger: quote.ledger,
      };
    case QuoteStatus.NoRoute:
      return { ...row, ...unpriced, cause: quote.cause, reason: null };
    case QuoteStatus.Error:
      return { ...row, ...unpriced, cause: quote.cause, reason: quote.reason };
  }
}
