import type { SwapAssets } from '@fair-fx/core';
import { simulateRead, SimulationError } from '@fair-fx/core/stellar';
import { Contract, type rpc } from '@stellar/stellar-sdk';
import { MissingRouterError } from './missing-router.error.ts';
import { GET_FACTORY } from './soroswap.constants.ts';
import type { SoroswapNetwork } from './soroswap.types.ts';

/** The direct path of a swap: the contract of the token paid in, then of the token paid out. */
export function swapPath(swap: SwapAssets): readonly string[] {
  return [swap.input.contract, swap.output.contract];
}

/**
 * Throws a `MissingRouterError` when the contract at `network.soroswapRouter` does not answer as a
 * router. A failure to reach the RPC node says nothing about the router, so it is thrown as it came.
 */
export async function requireRouter(server: rpc.Server, network: SoroswapNetwork): Promise<void> {
  try {
    await simulateRead(server, network, new Contract(network.soroswapRouter).call(GET_FACTORY));
  } catch (failure) {
    if (failure instanceof SimulationError) {
      throw new MissingRouterError(`no Soroswap router answers at ${network.soroswapRouter}`, { cause: failure });
    }

    throw failure;
  }
}
