import type { Direction, Pair } from '../pair/index.ts';

/** Venues FairFX quotes. SDEX includes the Classic AMM, Horizon returns them as one path. */
export enum VenueId {
  Sdex = 'sdex',
  Soroswap = 'soroswap',
  Aquarius = 'aquarius',
  Curve = 'curve',
}

/** How the floor is enforced: A, the guard contract wraps the swap; B, the app sets destMin. */
export enum GuardMode {
  A = 'A',
  B = 'B',
}

/** Outcome of asking a venue for a quote. A failure is a status, never a zero amount. */
export enum QuoteStatus {
  Ok = 'ok',
  NoRoute = 'no_route',
  Error = 'error',
}

export interface QuoteOk<Route> {
  readonly status: QuoteStatus.Ok;
  /** In the smallest unit of the output token. Always above zero. */
  readonly amountOut: bigint;
  /** What the venue needs to execute this quote, in the venue's own shape. */
  readonly route: Route;
  /** Latest ledger the venue's source had seen, or `null` when it does not say. */
  readonly ledger: number | null;
}

/**
 * The venue answered and has no way to make this swap: no path, no pool for the pair, a token it does
 * not list, or a path that pays nothing. Every venue reports these the same way.
 */
export interface QuoteNoRoute {
  readonly status: QuoteStatus.NoRoute;
}

/** The venue gave no usable answer: a timeout, an HTTP error that is not a `no_route`, or a response of the wrong shape. */
export interface QuoteError {
  readonly status: QuoteStatus.Error;
  readonly reason: string;
}

/** What a venue would pay for one swap. A quote, not a fill. */
export type Quote<Route = unknown> = QuoteOk<Route> | QuoteNoRoute | QuoteError;

/** One venue behind the shape the collector, the SDK and the CLI quote through. */
export interface VenueAdapter<Route = unknown> {
  readonly id: VenueId;
  readonly mode: GuardMode;
  /** `amountIn` is in the smallest unit of the input token. Never rejects: a failure is an `error` quote. */
  quote(pair: Pair, direction: Direction, amountIn: bigint): Promise<Quote<Route>>;
}
