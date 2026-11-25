import { z } from 'zod';
import { Network } from '../network.ts';
import { accountId, contractId, httpsUrl } from './fields.ts';
import { entryFor, parseOrThrow } from './parse.ts';

const networkSchema = z.strictObject({
  passphrase: z.string().min(1),
  horizonUrl: httpsUrl,
  rpcUrl: httpsUrl,
  aquariusFindPathUrl: httpsUrl,
  soroswapRouter: contractId,
  reflectorFiatFeed: contractId,
  /** Source account for read-only simulations. Nothing is signed with it. */
  simulationSource: accountId,
});

const networksFileSchema = z.partialRecord(z.enum(Network), networkSchema);

/** Passphrase, endpoints and contract addresses of one network, from `config/networks.json`. */
export type NetworkConfig = Readonly<z.infer<typeof networkSchema>>;

/** Validates the parsed `networks.json` and returns the entry for `network`. Throws ConfigError. */
export function parseNetworkConfig(json: unknown, network: Network): NetworkConfig {
  return entryFor(parseOrThrow(networksFileSchema, json), network);
}
