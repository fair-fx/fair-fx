import type { Direction, Pair, Quote, ReferenceReading, ReferenceSource, VenueId } from '@fair-fx/core';

/** One quote a run took, with the pair it was asked for. */
export interface TakenQuote {
  readonly pair: Pair;
  readonly direction: Direction;
  readonly venue: VenueId;
  /** In the smallest unit of the input token. */
  readonly amountIn: bigint;
  /** When the venue's answer arrived. */
  readonly quotedAt: Date;
  readonly quote: Quote;
}

/** The reference prices a run read, one per currency of its pairs, and the source they came from. */
export interface ReferenceSet {
  readonly source: ReferenceSource;
  readonly readings: readonly ReferenceReading[];
}
