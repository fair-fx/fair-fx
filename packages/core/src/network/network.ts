import { entryFor, parseOrThrow } from '../shared/index.ts';
import { networksFileSchema } from './network.schema.ts';
import type { Network, NetworkConfig } from './network.types.ts';

/** Validates the parsed `networks.json` and returns the entry for `network`. Throws ConfigError. */
export function parseNetworkConfig(json: unknown, network: Network): NetworkConfig {
  return entryFor(parseOrThrow(networksFileSchema, json), network);
}
