import type { NetworkConfig } from '@fair-fx/core';

/** What the Aquarius router needs to make the swap a quote is for, as find-path gave it. */
export interface AquariusRoute {
  /** The swap chain as base64 XDR, passed unchanged to the router's `swap_chained`. Not decoded here. */
  readonly swapChainXdr: string;
  /** The pool contracts the swap goes through, in order. */
  readonly pools: readonly string[];
  /** The token contracts along the way, from the token paid in to the token paid out. */
  readonly tokens: readonly string[];
}

/** The path find-path found for a swap. */
export interface AquariusPath {
  /** In the smallest unit of the token paid out. Zero or more. */
  readonly amountOut: bigint;
  readonly route: AquariusRoute;
}

/** The body of a find-path request. */
export interface FindPathRequest {
  readonly token_in_address: string;
  readonly token_out_address: string;
  /** In the smallest unit of the token paid in, as text so that JSON keeps every digit. */
  readonly amount: string;
}

/** The part of the network config the Aquarius adapter reads. */
export type AquariusNetwork = Pick<NetworkConfig, 'aquariusFindPathUrl'>;
