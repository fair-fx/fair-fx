import { NoRouteCause, type Quote } from '@fair-fx/core';
import { SimulationError } from '@fair-fx/core/node';
import type { rpc } from '@stellar/stellar-sdk';
import { noRouteQuote } from '../shared/index.ts';
import { requireRouter } from './router.ts';
import { EMPTY_POOL, MISSING_CONTRACT } from './soroswap.constants.ts';
import type { SoroswapNetwork, SoroswapRoute } from './soroswap.types.ts';

/** Whether `failure` is a simulation the host or the contract refused with `hostError`. */
export function simulationFailedWith(failure: unknown, hostError: string): boolean {
  return failure instanceof SimulationError && failure.message.includes(hostError);
}

/**
 * What a failed `router_get_amounts_out` means for the quote. An empty pool is `no_route` as `no_path`.
 * So is a pair nobody created, but only once the router has answered another call: an address that is
 * not a router fails the same way, and that is an error. Any other failure is thrown again.
 */
export async function noRouteOrThrow(
  failure: unknown,
  server: rpc.Server,
  network: SoroswapNetwork,
): Promise<Quote<SoroswapRoute>> {
  if (simulationFailedWith(failure, EMPTY_POOL)) {
    return noRouteQuote(NoRouteCause.NoPath);
  }

  if (!simulationFailedWith(failure, MISSING_CONTRACT)) {
    throw failure;
  }

  await requireRouter(server, network);

  return noRouteQuote(NoRouteCause.NoPath);
}
