import type { PairsConfig } from '../../index.ts';
import { parseOrThrow } from '../../shared/index.ts';
import { sacPinnedPairsSchema } from './pinned-sac.schema.ts';

/**
 * Throws ConfigError when a pair pins a contract that is not the SAC of its asset's code and issuer on
 * the network of `passphrase`. One venue is asked by contract and another by code and issuer, so a
 * pair that fails this would be quoted as two different assets. The contract ID of a SAC follows
 * from the code, the issuer and the passphrase, so nothing is read from the network.
 */
export function requirePinnedSacs(config: PairsConfig, passphrase: string): void {
  parseOrThrow(sacPinnedPairsSchema(passphrase), { pairs: { [config.network]: config.pairs } });
}
