import type { Fiat } from '../asset/index.ts';

/** How a read of one currency's reference price ended. */
export enum ReferenceStatus {
  Ok = 'ok',
  /** The feed has no price for the currency. */
  Missing = 'missing',
  /** The feed answered with something that is not a usable price. */
  Invalid = 'invalid',
  /** The feed could not be reached, or the call failed. */
  Unavailable = 'unavailable',
}

export interface ReferencePrice {
  readonly status: ReferenceStatus.Ok;
  readonly fiat: Fiat;
  /** USD price of the currency, scaled by `10^decimals`. */
  readonly price: bigint;
  readonly decimals: number;
  /**
   * When the feed set this price, in Unix seconds. However old it is, the price is returned as the
   * feed gave it: judging its age is the caller's decision.
   *
   * `null` for the feed's base currency: its price is a constant, is not stored as a sample and
   * never ages.
   */
  readonly oracleTime: number | null;
}

export interface ReferenceMissing {
  readonly status: ReferenceStatus.Missing;
  readonly fiat: Fiat;
}

export interface ReferenceFailure {
  readonly status: ReferenceStatus.Invalid | ReferenceStatus.Unavailable;
  readonly fiat: Fiat;
  readonly reason: string;
}

/** A reference read never falls back to an earlier price: it is one of these, each time. */
export type ReferenceReading = ReferencePrice | ReferenceMissing | ReferenceFailure;

/** What `lastprice` of a SEP-40 feed returns for a currency it has a price for. */
export interface FeedPrice {
  readonly price: bigint;
  /** Unix seconds. */
  readonly timestamp: bigint;
}

/** The two SEP-40 calls a reference read makes. Each resolves to what the feed returned, unchecked. */
export interface ReferenceFeed {
  decimals(): Promise<unknown>;
  /** Resolves to `null` when the feed has no price for `fiat`. */
  lastPrice(fiat: Fiat): Promise<unknown>;
}
