import { rateLeg, swapAssets } from '@fair-fx/core';
import type { Shortfall } from '@fair-fx/db/writes';
import { INT32_MAX, INT32_MIN } from './quotes.constants.ts';
import type { ReferenceSet, TakenQuote } from './quotes.types.ts';
import { measuredShortfallBps } from './shortfall-bps.ts';

/**
 * The shortfall to store for a quote that pays `amountOut`, or `null` when there is none to store:
 * a currency of the pair has no price in `references`, the rate math gives no number, or the number
 * does not fit the column it is stored in.
 *
 * Whether the prices are recent enough to compare with is the caller's decision.
 */
export function quoteShortfall(taken: TakenQuote, amountOut: bigint, references: ReferenceSet): Shortfall | null {
  const assets = swapAssets(taken.pair, taken.direction);
  const input = rateLeg(assets.input, references.readings);
  const output = rateLeg(assets.output, references.readings);
  if (input === null || output === null) {
    return null;
  }

  const bps = measuredShortfallBps(taken.amountIn, amountOut, input, output);
  if (bps === null || bps < INT32_MIN || bps > INT32_MAX) {
    return null;
  }

  return { bps, source: references.source };
}
