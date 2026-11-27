import { rpc } from '@stellar/stellar-sdk';
import { DEFAULT_TIMEOUT_MS, type LedgerSource, type NetworkConfig } from '../../index.ts';

export type LedgerSourceNetwork = Pick<NetworkConfig, 'rpcUrl'>;

/** The Soroban RPC node of `network`, asked for its latest ledger. */
export function sorobanLedgerSource(network: LedgerSourceNetwork): LedgerSource {
  const server = new rpc.Server(network.rpcUrl, { timeout: DEFAULT_TIMEOUT_MS });

  return {
    // The unparsed call: `getLatestLedger` also decodes the header and meta XDR, which a reading
    // does not use, and throws when it cannot.
    latestLedger: () => server._getLatestLedger(),
  };
}
