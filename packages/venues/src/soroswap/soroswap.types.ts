import type { NetworkConfig } from '@fair-fx/core';
import type { SimulationNetwork } from '@fair-fx/core/node';
import type { HttpOptions } from '../shared/index.ts';

/** The token contracts a quote swaps through, input first. FairFX asks for the direct pair only. */
export interface SoroswapRoute {
  readonly path: readonly string[];
}

/** What `router_get_amounts_out` returns for a direct pair, with each amount named. */
export interface DirectAmounts {
  readonly amountIn: bigint;
  /** Zero or more. */
  readonly amountOut: bigint;
}

/** The part of the network config the Soroswap adapter reads. */
export type SoroswapNetwork = SimulationNetwork & Pick<NetworkConfig, 'rpcUrl' | 'soroswapRouter'>;

export type SoroswapOptions = Pick<HttpOptions, 'timeoutMs'>;
