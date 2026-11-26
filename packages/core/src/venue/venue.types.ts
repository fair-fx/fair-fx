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

/**
 * Why a venue has no way to make a swap, as far as the venue says. A venue that cannot tell reports
 * `no_path`, so `no_path` does not rule out the other two.
 */
export enum NoRouteCause {
  /** No path, or no pool for the pair. */
  NoPath = 'no_path',
  /** The venue lists no such token. */
  UnlistedToken = 'unlisted_token',
  /** The venue found a path and it pays zero: the amount in is too small for it. */
  PaysNothing = 'pays_nothing',
}

/**
 * Why there is no usable answer from a venue. Read from the transport and the HTTP status, not from what
 * the venue meant.
 */
export enum QuoteErrorCause {
  /** The caller asked for what no venue quotes: an amount in of zero or less. The venue was not asked. */
  BadRequest = 'bad_request',
  /** The venue did not answer within the timeout. */
  Timeout = 'timeout',
  /** The request failed before any answer came back: DNS, a refused connection. */
  Network = 'network',
  /** The venue cannot answer now: HTTP 429 or 5xx. The same request may work later. */
  Unavailable = 'unavailable',
  /**
   * The venue refused this request: any other HTTP error, a JSON-RPC error, a failed simulation, or no
   * router at the configured address. Waiting is not expected to help.
   */
  Rejected = 'rejected',
  /** The venue answered and the answer cannot be read: not JSON, or another shape. */
  BadAnswer = 'bad_answer',
  /** A failure the adapter does not recognise. */
  Unknown = 'unknown',
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
 * not list, or a path that pays nothing. Every venue gives these the status `no_route`. The cause is
 * only as exact as the venue's answer.
 */
export interface QuoteNoRoute {
  readonly status: QuoteStatus.NoRoute;
  readonly cause: NoRouteCause;
}

/** There is no usable answer from the venue. `cause` is the kind of failure, `reason` the detail as text. */
export interface QuoteError {
  readonly status: QuoteStatus.Error;
  readonly cause: QuoteErrorCause;
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
