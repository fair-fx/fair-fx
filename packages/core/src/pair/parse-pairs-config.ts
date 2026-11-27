import type { Network } from '../network/index.ts';
import { entryFor, parseOrThrow } from '../shared/index.ts';
import { pairsFileSchema } from './pair.schema.ts';
import type { PairsConfig } from './pair.types.ts';

/** Validates the parsed `pairs.json` and returns the pairs of `network`. Throws ConfigError. */
export function parsePairsConfig(json: unknown, network: Network): PairsConfig {
  const file = parseOrThrow(pairsFileSchema, json);

  return { network, ladder: file.ladder, pairs: entryFor(file.pairs, network) };
}
