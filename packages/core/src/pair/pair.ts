import { z } from 'zod';
import { pinnedAssetSchema } from '../asset/index.ts';
import { Network } from '../network/index.ts';
import { entryFor, parseOrThrow } from '../shared/index.ts';

const LADDER_RUNGS = 10;

const pairSchema = z
  .strictObject({ base: pinnedAssetSchema, quote: pinnedAssetSchema })
  .refine((pair) => pair.base.contract !== pair.quote.contract, 'base and quote are the same asset')
  .transform((pair) => ({ id: `${pair.base.code}/${pair.quote.code}`, ...pair }));

/** Input sizes in whole units of the input token. */
const ladderSchema = z
  .array(z.int().positive())
  .length(LADDER_RUNGS)
  .refine(isStrictlyIncreasing, 'expected each rung to be larger than the one before')
  .transform((rungs) => rungs.map(BigInt));

const pairsFileSchema = z.strictObject({
  ladder: ladderSchema,
  pairs: z.partialRecord(z.enum(Network), z.array(pairSchema)),
});

/** Two pinned assets. `id` is `BASE/QUOTE`, for example `USDC/EURC`. */
export type Pair = Readonly<z.infer<typeof pairSchema>>;

/** The pairs of one network and the shared ladder, from `config/pairs.json`. */
export interface PairsConfig {
  readonly network: Network;
  readonly ladder: readonly bigint[];
  readonly pairs: readonly Pair[];
}

/** Validates the parsed `pairs.json` and returns the pairs of `network`. Throws ConfigError. */
export function parsePairsConfig(json: unknown, network: Network): PairsConfig {
  const file = parseOrThrow(pairsFileSchema, json);
  return { network, ladder: file.ladder, pairs: entryFor(file.pairs, network) };
}

function isStrictlyIncreasing(values: readonly number[]): boolean {
  return values.every((value, i) => i === 0 || value > values[i - 1]!);
}
