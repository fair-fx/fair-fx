import { Contract, rpc, xdr } from '@stellar/stellar-sdk';
import type { NetworkConfig, ReferenceFeed } from '../index.ts';
import { simulateRead, type SimulationNetwork } from './simulate-read.ts';

const RPC_TIMEOUT_MS = 10_000;

export type ReferenceFeedNetwork = SimulationNetwork & Pick<NetworkConfig, 'rpcUrl' | 'reflectorFiatFeed'>;

/** The Reflector fiat feed of `network`, read by simulation over Soroban RPC. */
export function sorobanReferenceFeed(network: ReferenceFeedNetwork): ReferenceFeed {
  const server = new rpc.Server(network.rpcUrl, { timeout: RPC_TIMEOUT_MS });
  const feed = new Contract(network.reflectorFiatFeed);

  return {
    decimals: () => simulateRead(server, network, feed.call('decimals')),
    lastPrice: (fiat) => {
      // SEP-40 names a fiat currency as the enum variant `Other(Symbol)`.
      const asset = xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Other'), xdr.ScVal.scvSymbol(fiat)]);

      return simulateRead(server, network, feed.call('lastprice', asset));
    },
  };
}
