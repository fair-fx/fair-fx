import { DEFAULT_TIMEOUT_MS, swapAssets, VenueId, type VenueAdapter } from '@fair-fx/core';
import { simulateRead } from '@fair-fx/core/stellar';
import { rpc } from '@stellar/stellar-sdk';
import { GUARD_MODE } from '../guard-mode/index.ts';
import { quoteOrError } from '../quote/index.ts';
import { noRouteOrThrow } from './no-route.ts';
import { swapPath } from './router.ts';
import { rpcFailure } from './rpc-failure.ts';
import { getAmountsOutCall, toSoroswapQuote } from './soroswap.ts';
import type { SoroswapNetwork, SoroswapOptions, SoroswapRoute } from './soroswap.types.ts';

/**
 * Quotes the Soroswap pool of a pair, by simulating a read of the router over Soroban RPC. A quote is one
 * read, or two when the first one fails as a missing contract. `timeoutMs` bounds each read.
 */
export function soroswapAdapter(network: SoroswapNetwork, options: SoroswapOptions = {}): VenueAdapter<SoroswapRoute> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const server = new rpc.Server(network.rpcUrl, { timeout: timeoutMs });

  return {
    id: VenueId.Soroswap,
    mode: GUARD_MODE[VenueId.Soroswap],

    quote(pair, direction, amountIn) {
      return quoteOrError(amountIn, rpcFailure, async () => {
        const path = swapPath(swapAssets(pair, direction));
        const call = getAmountsOutCall(network.soroswapRouter, amountIn, path);

        try {
          return toSoroswapQuote(await simulateRead(server, network, call), path);
        } catch (failure) {
          return await noRouteOrThrow(failure, server, network);
        }
      });
    },
  };
}
