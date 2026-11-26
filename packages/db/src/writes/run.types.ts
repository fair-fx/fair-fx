import type {
  Direction,
  QuoteError,
  QuoteNoRoute,
  QuoteOk,
  ReferenceFailure,
  ReferenceMissing,
  ReferencePrice,
  ReferenceSource,
  ReferenceState,
  VenueId,
} from '@fair-fx/core';

/** A price as a run stores it. The feed's base currency has no oracle time, and is not stored. */
export type StoredPrice = ReferencePrice & { readonly oracleTime: number };

/** One read of a reference price in a run, whether or not it gave a price. */
export interface ReferenceSample {
  readonly source: ReferenceSource;
  readonly reading: StoredPrice | ReferenceMissing | ReferenceFailure;
}

/** How far a quote falls short of the reference, and which reference that was. */
export interface Shortfall {
  /** Positive when the venue pays less than the reference. Must fit a 32 bit integer. */
  readonly bps: bigint;
  readonly source: ReferenceSource;
}

/** What a quote was asked for, and when its answer arrived. */
export interface QuoteRequest {
  /** `BASE/QUOTE`, for example `USDC/EURC`. */
  readonly pair: string;
  readonly direction: Direction;
  readonly venue: VenueId;
  /** In the smallest unit of the input token. */
  readonly amountIn: bigint;
  readonly quotedAt: Date;
}

/** A quote that gave an amount. `shortfall` is `null` when the run had no reference to compare it with. */
export interface PricedQuoteSample extends QuoteRequest {
  /** The route must be plain JSON data: it is stored as `jsonb`. */
  readonly quote: QuoteOk<unknown>;
  readonly shortfall: Shortfall | null;
}

/** A quote that gave no amount, so it has no shortfall. */
export interface UnpricedQuoteSample extends QuoteRequest {
  readonly quote: QuoteNoRoute | QuoteError;
}

export type QuoteSample = PricedQuoteSample | UnpricedQuoteSample;

/** A collector run that has finished, with everything it read. It is written once, as a whole. */
export interface FinishedRun {
  /** Start of the run's 5 minute slot. At most one run is stored per slot. */
  readonly slot: Date;
  readonly startedAt: Date;
  readonly finishedAt: Date;
  /** Latest ledger the RPC node reported during the run, or `null` when it did not answer. */
  readonly ledger: number | null;
  readonly referenceState: ReferenceState;
  readonly references: readonly ReferenceSample[];
  /** At most one per pair, direction, venue and amount in. */
  readonly quotes: readonly QuoteSample[];
}

/** How writing a run ended. */
export enum WriteRunOutcome {
  /** The run and all its samples are stored. */
  Written = 'written',
  /** Another run already wrote this slot. Nothing was stored. */
  SlotTaken = 'slot_taken',
}
