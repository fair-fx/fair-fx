import { join } from 'node:path';
import {
  parseNetworkConfig,
  parsePairsConfig,
  type Network,
  type NetworkConfig,
  type PairsConfig,
} from '../index.ts';
import { loadFile } from './load-file.ts';
import { requirePinnedSacs } from './pinned-sac.ts';

/** Everything FairFX reads from `config/` for one network. */
export interface Config extends PairsConfig {
  readonly endpoints: NetworkConfig;
}

/**
 * Reads `networks.json` and `pairs.json` from `dir` (the repo's `config/` folder). Throws ConfigError,
 * also when a pair pins a contract that is not the SAC of its code and issuer on that network.
 */
export async function loadConfig(dir: string, network: Network): Promise<Config> {
  const [endpoints, pairs] = await Promise.all([
    loadFile(join(dir, 'networks.json'), (json) => parseNetworkConfig(json, network)),
    loadFile(join(dir, 'pairs.json'), (json) => parsePairsConfig(json, network)),
  ]);
  requirePinnedSacs(pairs, endpoints.passphrase);

  return { ...pairs, endpoints };
}
