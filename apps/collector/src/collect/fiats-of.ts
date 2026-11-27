import type { Fiat, Pair } from '@fair-fx/core';

/** Every currency the tokens of `pairs` stand for, once each, in the order they first appear. */
export function fiatsOf(pairs: readonly Pair[]): Fiat[] {
  return [...new Set(pairs.flatMap((pair) => [pair.base.fiat, pair.quote.fiat]))];
}
