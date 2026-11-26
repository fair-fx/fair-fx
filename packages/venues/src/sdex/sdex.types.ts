import type { NetworkConfig } from '@fair-fx/core';

/** An asset a path payment passes through: XLM, or a classic asset by code and issuer. */
export type SdexHop = 'native' | { readonly code: string; readonly issuer: string };

/** What a path payment needs besides its two tokens. `path` is empty for a direct trade. */
export interface SdexRoute {
  readonly path: readonly SdexHop[];
}

/** One way Horizon found to make the swap. */
export interface SdexPath {
  readonly amountOut: bigint;
  readonly route: SdexRoute;
}

/** The part of the network config the SDEX adapter reads. */
export type SdexNetwork = Pick<NetworkConfig, 'horizonUrl'>;
