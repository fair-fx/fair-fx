import type { Pair, ReferenceFeed, ReferenceSource } from '@fair-fx/core';
import { readReference } from '@fair-fx/core/stellar';
import type { ReferenceSet } from '../quotes/index.ts';
import { fiatsOf } from './fiats-of.ts';

/**
 * Reads the reference price of every currency of `pairs`, all at once. The currencies come from the
 * pairs, so a pair cannot be quoted without the prices its shortfall needs.
 */
export async function readReferences(
  feed: ReferenceFeed,
  source: ReferenceSource,
  pairs: readonly Pair[],
): Promise<ReferenceSet> {
  const readings = await Promise.all(fiatsOf(pairs).map((fiat) => readReference(feed, fiat)));

  return { source, readings };
}
