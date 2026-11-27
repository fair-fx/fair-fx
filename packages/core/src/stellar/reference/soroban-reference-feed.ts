import { Contract, rpc, xdr } from '@stellar/stellar-sdk';
import { DEFAULT_TIMEOUT_MS, type NetworkConfig, type ReferenceFeed } from '../../index.ts';
import { simulateRead, type SimulationNetwork } from '../simulation/index.ts';

export type ReferenceFeedNetwork = SimulationNetwork & Pick<NetworkConfig, 'rpcUrl' | 'reflectorFiatFeed'>;

/** The Reflector fiat feed of `network`, read by simulation over Soroban RPC. */
export function sorobanReferenceFeed(network: ReferenceFeedNetwork): ReferenceFeed {
  const server = new rpc.Server(network.rpcUrl, { timeout: DEFAULT_TIMEOUT_MS });
  const feed = new Contract(network.reflectorFiatFeed);
  const read = async (call: xdr.Operation): Promise<unknown> => (await simulateRead(server, network, call)).value;

  return {
    decimals: () => read(feed.call('decimals')),
    lastPrice: (fiat) => {
      // SEP-40 names a fiat currency as the enum variant `Other(Symbol)`.
      const asset = xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Other'), xdr.ScVal.scvSymbol(fiat)]);

      return read(feed.call('lastprice', asset));
    },
  };
}
